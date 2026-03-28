import test from 'node:test'
import assert from 'node:assert/strict'

process.env.DISABLE_QUEUE_WORKER_LOOPS = 'true'

const {
  runScheduler,
  runWorker,
  setQueueWorkerDepsForTests,
  resetQueueWorkerDepsForTests,
  resetQueueWorkerRuntimeForTests,
} = await import('../queueWorker.js')

function createState(overrides = {}) {
  return {
    campaigns: [],
    schedules: [],
    contacts: [],
    lists: [],
    queue: [],
    reputation: [],
    logs: [],
    userProfiles: [],
    appSettings: [{ evolution_api_url: '', evolution_api_key: '', evolution_shared_instance: '' }],
    now: new Date('2026-03-27T10:00:00'),
    nextQueueId: 1,
    ...overrides,
  }
}

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function createQueryMock(state) {
  return async (text, params = []) => {
    const sql = String(text).replace(/\s+/g, ' ').trim()

    if (sql.includes("FROM campaign_schedule cs LEFT JOIN whatsapp_reputation wr ON wr.user_id = cs.user_id WHERE cs.status = 'pausado'")) {
      const rows = state.schedules
        .filter((s) => s.status === 'pausado' && state.queue.some((q) => q.schedule_id === s.id && q.status === 'pendente'))
        .map((s) => ({
          id: s.id,
          campaign_id: s.campaign_id,
          user_id: s.user_id,
          limite_diario: s.limite_diario,
          pause_reason: s.pause_reason ?? null,
          pause_details: s.pause_details ?? null,
          paused_at: s.paused_at ?? null,
          reputation_level: state.reputation.find((r) => r.user_id === s.user_id)?.level || 'NOVO',
        }))
      return { rows }
    }

    if (sql.includes("FROM campaign_schedule cs WHERE cs.status = 'preparando'")) {
      const rows = state.schedules
        .filter((s) => s.status === 'preparando')
        .map((s) => ({
          id: s.id,
          campaign_id: s.campaign_id,
          has_queue: state.queue.some((q) => q.schedule_id === s.id),
        }))
      return { rows }
    }

    if (
      sql.includes("SELECT COUNT(*)::int AS total FROM message_queue WHERE user_id = $1 AND status = 'enviado' AND data_envio >= CURRENT_DATE") ||
      sql.includes("SELECT count(*) FROM message_queue WHERE user_id = $1 AND status = 'enviado' AND data_envio >= CURRENT_DATE")
    ) {
      const total = state.queue.filter((q) => q.user_id === params[0] && q.status === 'enviado').length
      return { rows: [{ total, count: String(total) }] }
    }

    if (sql.startsWith('UPDATE campaign_schedule SET status = $1, pause_reason = NULL, pause_details = NULL, scheduler_claimed_at = NULL WHERE id = $2')) {
      const schedule = state.schedules.find((s) => s.id === params[1])
      if (schedule) {
        schedule.status = params[0]
        schedule.pause_reason = null
        schedule.pause_details = null
        schedule.scheduler_claimed_at = null
      }
      return { rows: [] }
    }

    if (sql.startsWith("UPDATE campaign_schedule SET status = 'erro', pause_details = $1, scheduler_claimed_at = NULL WHERE id = $2")) {
      const schedule = state.schedules.find((s) => s.id === params[1])
      if (schedule) {
        schedule.status = 'erro'
        schedule.pause_details = params[0]
        schedule.scheduler_claimed_at = null
      }
      return { rows: [] }
    }

    if (sql.startsWith("UPDATE campaign_schedule SET status = 'agendado', scheduler_claimed_at = NULL WHERE id = $1")) {
      const schedule = state.schedules.find((s) => s.id === params[0])
      if (schedule) {
        schedule.status = 'agendado'
        schedule.scheduler_claimed_at = null
      }
      return { rows: [] }
    }

    if (sql.startsWith("UPDATE campaign_schedule SET status = 'em_execucao', scheduler_claimed_at = NULL WHERE id = $1")) {
      const schedule = state.schedules.find((s) => s.id === params[0])
      if (schedule) {
        schedule.status = 'em_execucao'
        schedule.scheduler_claimed_at = null
      }
      return { rows: [] }
    }

    if (sql.startsWith('UPDATE campaign_schedule SET status = \'concluido\'')) {
      const schedule = state.schedules.find((s) => s.id === params[1])
      if (schedule) schedule.status = 'concluido'
      return { rows: [] }
    }

    if (sql.startsWith('UPDATE campaign_schedule SET status = $1 WHERE id = $2')) {
      const schedule = state.schedules.find((s) => s.id === params[1])
      if (schedule) schedule.status = params[0]
      return { rows: [] }
    }

    if (sql.startsWith('INSERT INTO scheduler_logs')) {
      state.logs.push({
        id: state.logs.length + 1,
        event: params[0],
        details: params[1],
      })
      return { rows: [] }
    }

    if (sql.includes("WITH due_schedules AS ( SELECT id FROM campaign_schedule WHERE status = 'agendado'")) {
      const dueSchedules = state.schedules
        .filter((s) => s.status === 'agendado')
        .map((s) => {
          s.status = 'preparando'
          s.scheduler_claimed_at = state.now.toISOString()
          return clone(s)
        })
      return { rows: dueSchedules }
    }

    if (sql === 'SELECT * FROM campaigns WHERE id = $1') {
      const campaign = state.campaigns.find((c) => c.id === params[0])
      return { rows: campaign ? [clone(campaign)] : [] }
    }

    if (sql === 'SELECT 1 FROM message_queue WHERE schedule_id = $1 LIMIT 1') {
      const found = state.queue.find((q) => q.schedule_id === params[0])
      return { rows: found ? [{ 1: 1 }] : [] }
    }

    if (sql === 'SELECT id FROM lists WHERE user_id = $1 AND name = $2 LIMIT 1') {
      const [userId, listName] = params
      return {
        rows: state.lists.filter((l) => l.user_id === userId && l.name === listName).slice(0, 1).map(clone)
      }
    }

    if (sql.includes('FROM contacts WHERE user_id = $1') && sql.includes('AND list_id = $2')) {
      const [userId, listId] = params
      return {
        rows: state.contacts.filter((c) => c.user_id === userId && c.list_id === listId && String(c.phone || '').trim()).map(clone)
      }
    }

    if (sql.startsWith('INSERT INTO message_queue')) {
      const item = {
        id: state.nextQueueId++,
        schedule_id: params[0],
        campaign_id: params[1],
        user_id: params[2],
        contact_id: params[3],
        telefone: params[4],
        nome: params[5],
        mensagem: params[6],
        status: 'pendente',
        tentativas: 0,
      }
      state.queue.push(item)
      return { rows: [clone(item)] }
    }

    if (sql.includes("FROM campaign_schedule cs WHERE cs.status = 'em_execucao'")) {
      const rows = state.schedules
        .filter((s) =>
          s.status === 'em_execucao' &&
          state.queue.some((q) => q.schedule_id === s.id) &&
          !state.queue.some((q) => q.schedule_id === s.id && (q.status === 'pendente' || q.status === 'processando'))
        )
        .map((s) => ({ id: s.id, campaign_id: s.campaign_id }))
      return { rows }
    }

    if (sql.startsWith('SELECT COUNT(*) FILTER (WHERE status =')) {
      const campaignId = params[0]
      const queue = state.queue.filter((q) => q.campaign_id === campaignId)
      return {
        rows: [{
          pendente: queue.filter((q) => q.status === 'pendente').length,
          processando: queue.filter((q) => q.status === 'processando').length,
          enviado: queue.filter((q) => q.status === 'enviado').length,
          falhou: queue.filter((q) => q.status === 'falhou').length,
        }]
      }
    }

    if (sql === 'UPDATE campaigns SET status = $1 WHERE id = $2') {
      const campaign = state.campaigns.find((c) => c.id === params[1])
      if (campaign) campaign.status = params[0]
      return { rows: [] }
    }

    if (sql.startsWith("UPDATE message_queue mq SET status = 'processando'")) {
      const eligible = state.queue.find((q) => {
        const schedule = state.schedules.find((s) => s.id === q.schedule_id)
        return q.status === 'pendente' && schedule?.status === 'em_execucao'
      })
      if (!eligible) return { rows: [] }
      eligible.status = 'processando'
      eligible.processing_started_at = state.now.toISOString()
      return { rows: [clone(eligible)] }
    }

    if (sql === 'SELECT * FROM campaign_schedule WHERE id = $1 LIMIT 1') {
      const schedule = state.schedules.find((s) => s.id === params[0])
      return { rows: schedule ? [clone(schedule)] : [] }
    }

    if (sql === 'SELECT * FROM whatsapp_reputation WHERE user_id = $1') {
      const rep = state.reputation.find((r) => r.user_id === params[0])
      return { rows: rep ? [clone(rep)] : [] }
    }

    if (sql.startsWith('INSERT INTO whatsapp_reputation')) {
      const rep = { user_id: params[0], level: 'NOVO' }
      state.reputation.push(rep)
      return { rows: [clone(rep)] }
    }

    if (sql === 'SELECT evolution_url, evolution_apikey, evolution_instance FROM user_profiles WHERE id = $1 LIMIT 1') {
      const profile = state.userProfiles.find((p) => p.id === params[0]) || {}
      return { rows: [clone(profile)] }
    }

    if (sql === 'SELECT evolution_api_url, evolution_api_key, evolution_shared_instance FROM app_settings ORDER BY id DESC LIMIT 1') {
      return { rows: [clone(state.appSettings[state.appSettings.length - 1] || {})] }
    }

    if (sql === 'SELECT status FROM campaign_schedule WHERE id = $1 LIMIT 1') {
      const schedule = state.schedules.find((s) => s.id === params[0])
      return { rows: schedule ? [{ status: schedule.status }] : [] }
    }

    if (sql.startsWith('UPDATE message_queue SET status = $1, data_envio = NOW()')) {
      const item = state.queue.find((q) => q.id === params[1])
      if (item) {
        item.status = params[0]
        item.data_envio = state.now.toISOString()
        item.processing_started_at = null
      }
      return { rows: [] }
    }

    if (sql.startsWith('UPDATE message_queue SET status = $1, erro = $2, tentativas = tentativas + 1')) {
      const item = state.queue.find((q) => q.id === params[2])
      if (item) {
        item.status = params[0]
        item.erro = params[1]
        item.tentativas = (item.tentativas || 0) + 1
        item.processing_started_at = null
      }
      return { rows: [] }
    }

    if (sql.startsWith('UPDATE message_queue SET status = $1, erro = $2, processing_started_at = NULL WHERE id = $3')) {
      const item = state.queue.find((q) => q.id === params[2])
      if (item) {
        item.status = params[0]
        item.erro = params[1]
        item.processing_started_at = null
      }
      return { rows: [] }
    }

    if (sql.includes("UPDATE campaign_schedule SET status = 'pausado'")) {
      const [reason, details, userId] = params
      const rows = state.schedules
        .filter((s) => s.user_id === userId && s.status === 'em_execucao')
        .map((s) => {
          s.status = 'pausado'
          s.pause_reason = reason
          s.pause_details = details
          s.paused_at = state.now.toISOString()
          return { id: s.id, campaign_id: s.campaign_id }
        })
      return { rows }
    }

    if (sql.startsWith('UPDATE campaign_schedule SET status = \'em_execucao\',')) {
      const schedule = state.schedules.find((s) => s.id === params[0] || s.id === params[1])
      if (schedule) {
        schedule.status = 'em_execucao'
        schedule.pause_reason = null
        schedule.pause_details = null
        schedule.resumed_at = state.now.toISOString()
        schedule.scheduler_claimed_at = null
      }
      return { rows: [] }
    }

    if (sql.startsWith('UPDATE message_queue SET status = $1, processing_started_at = NULL WHERE id = $2')) {
      const item = state.queue.find((q) => q.id === params[1])
      if (item) {
        item.status = params[0]
        item.processing_started_at = null
      }
      return { rows: [] }
    }

    if (sql.startsWith('UPDATE message_queue SET status = \'pendente\'')) {
      return { rows: [] }
    }

    throw new Error(`SQL nÃ£o mockado: ${sql}`)
  }
}

test.afterEach(() => {
  resetQueueWorkerDepsForTests()
  resetQueueWorkerRuntimeForTests()
})

test('scheduler gera fila para campanha agendada com contatos elegÃ­veis', async () => {
  const state = createState({
    campaigns: [{ id: 'camp-1', channels: '["whatsapp"]', list_name: 'Lista A', variations: '[]', message: 'OlÃ¡', status: 'agendada' }],
    schedules: [{ id: 1, campaign_id: 'camp-1', user_id: 'user-1', status: 'agendado', limite_diario: 300 }],
    lists: [{ id: 'list-1', user_id: 'user-1', name: 'Lista A' }],
    contacts: [
      { id: 'c1', user_id: 'user-1', list_id: 'list-1', phone: '11999999999', name: 'Contato 1' },
      { id: 'c2', user_id: 'user-1', list_id: 'list-1', phone: '11888888888', name: 'Contato 2' },
    ],
  })

  setQueueWorkerDepsForTests({ query: createQueryMock(state) })
  await runScheduler()

  assert.equal(state.queue.length, 2)
  assert.equal(state.schedules[0].status, 'em_execucao')
  assert.equal(state.logs.some((log) => log.event === 'queue_created'), true)
})

test('scheduler nÃ£o conclui agendamento em execuÃ§Ã£o sem fila criada', async () => {
  const state = createState({
    campaigns: [{ id: 'camp-1', status: 'agendada' }],
    schedules: [{ id: 1, campaign_id: 'camp-1', user_id: 'user-1', status: 'em_execucao', limite_diario: 300 }],
  })

  setQueueWorkerDepsForTests({ query: createQueryMock(state) })
  await runScheduler()

  assert.equal(state.schedules[0].status, 'em_execucao')
})

test('scheduler reencola agendamento preso em preparando sem fila', async () => {
  const state = createState({
    schedules: [{ id: 1, campaign_id: 'camp-1', user_id: 'user-1', status: 'preparando', limite_diario: 300, scheduler_claimed_at: '2026-03-27T09:00:00.000Z' }],
  })

  setQueueWorkerDepsForTests({ query: createQueryMock(state) })
  await runScheduler()

  assert.notEqual(state.schedules[0].status, 'preparando')
  assert.equal(state.logs.some((log) => log.event === 'schedule_requeued'), true)
})

test('worker envia mensagem com sucesso sem chamar integraÃ§Ãµes reais', async () => {
  const state = createState({
    schedules: [{ id: 1, campaign_id: 'camp-1', user_id: 'user-1', status: 'em_execucao', limite_diario: 300, mensagens_por_lote: 45, tempo_pausa_lote: 15, intervalo_minimo: 1, intervalo_maximo: 1 }],
    queue: [{ id: 1, schedule_id: 1, campaign_id: 'camp-1', user_id: 'user-1', telefone: '11999999999', nome: 'Contato 1', mensagem: '<p>OlÃ¡ {name}</p>', status: 'pendente', tentativas: 0 }],
    userProfiles: [{ id: 'user-1', evolution_url: 'https://evolution.test', evolution_apikey: 'token', evolution_instance: 'instancia' }],
    reputation: [{ user_id: 'user-1', level: 'AQUECENDO' }],
  })

  const fetchCalls = []
  setQueueWorkerDepsForTests({
    query: createQueryMock(state),
    sleepImpl: async () => {},
    fetchImpl: async (...args) => {
      fetchCalls.push(args)
      return { ok: true, text: async () => '' }
    }
  })

  await runWorker()

  assert.equal(state.queue[0].status, 'enviado')
  assert.equal(fetchCalls.length, 1)
  assert.equal(state.logs.some((log) => log.event === 'envio_sucesso'), true)
})

test('worker pausa agendamentos quando atinge limite diÃ¡rio', async () => {
  const state = createState({
    schedules: [{ id: 1, campaign_id: 'camp-1', user_id: 'user-1', status: 'em_execucao', limite_diario: 1, mensagens_por_lote: 45, tempo_pausa_lote: 15, intervalo_minimo: 1, intervalo_maximo: 1 }],
    queue: [
      { id: 1, schedule_id: 1, campaign_id: 'camp-1', user_id: 'user-1', telefone: '11999999999', nome: 'Contato 1', mensagem: 'OlÃ¡', status: 'pendente', tentativas: 0 },
      { id: 2, schedule_id: 1, campaign_id: 'camp-1', user_id: 'user-1', telefone: '11888888888', nome: 'Contato 2', mensagem: 'OlÃ¡', status: 'enviado', tentativas: 0, data_envio: '2026-03-27T08:00:00Z' },
    ],
    reputation: [{ user_id: 'user-1', level: 'NOVO' }],
  })

  setQueueWorkerDepsForTests({ query: createQueryMock(state), sleepImpl: async () => {} })
  await runWorker()

  assert.equal(state.schedules[0].status, 'pausado')
  assert.equal(state.schedules[0].pause_reason, 'daily_limit')
  assert.equal(state.queue[0].status, 'pendente')
})

test('scheduler nÃ£o retoma pausa por limite diÃ¡rio no mesmo dia, mas retoma no dia seguinte', async () => {
  const sameDayState = createState({
    schedules: [{ id: 1, campaign_id: 'camp-1', user_id: 'user-1', status: 'pausado', limite_diario: 300, pause_reason: 'daily_limit', paused_at: '2026-03-27T07:00:00.000Z' }],
    queue: [{ id: 1, schedule_id: 1, campaign_id: 'camp-1', user_id: 'user-1', status: 'pendente' }],
  })
  setQueueWorkerDepsForTests({ query: createQueryMock(sameDayState) })
  await runScheduler()
  assert.equal(sameDayState.schedules[0].status, 'pausado')

  const nextDayState = createState({
    schedules: [{ id: 1, campaign_id: 'camp-1', user_id: 'user-1', status: 'pausado', limite_diario: 300, pause_reason: 'daily_limit', paused_at: '2026-03-26T07:00:00.000Z' }],
    queue: [{ id: 1, schedule_id: 1, campaign_id: 'camp-1', user_id: 'user-1', status: 'pendente' }],
  })
  setQueueWorkerDepsForTests({ query: createQueryMock(nextDayState) })
  await runScheduler()
  assert.equal(nextDayState.schedules[0].status, 'em_execucao')
})

test('worker pausa por reputaÃ§Ã£o crÃ­tica e sÃ³ volta a pendente sem enviar', async () => {
  const state = createState({
    schedules: [{ id: 1, campaign_id: 'camp-1', user_id: 'user-1', status: 'em_execucao', limite_diario: 300, mensagens_por_lote: 45, tempo_pausa_lote: 15, intervalo_minimo: 1, intervalo_maximo: 1 }],
    queue: [{ id: 1, schedule_id: 1, campaign_id: 'camp-1', user_id: 'user-1', telefone: '11999999999', nome: 'Contato 1', mensagem: 'OlÃ¡', status: 'pendente', tentativas: 0 }],
    reputation: [{ user_id: 'user-1', level: 'CRÃTICO' }],
  })

  setQueueWorkerDepsForTests({ query: createQueryMock(state), sleepImpl: async () => {} })
  await runWorker()

  assert.equal(state.schedules[0].status, 'pausado')
  assert.equal(state.schedules[0].pause_reason, 'reputation_critical')
  assert.equal(state.queue[0].status, 'pendente')
  assert.equal(state.logs.some((log) => log.event === 'schedule_paused'), true)
})

test('worker interrompe envio se o agendamento for cancelado durante o processamento', async () => {
  const state = createState({
    schedules: [{ id: 1, campaign_id: 'camp-1', user_id: 'user-1', status: 'em_execucao', limite_diario: 300, mensagens_por_lote: 45, tempo_pausa_lote: 15, intervalo_minimo: 1, intervalo_maximo: 1 }],
    queue: [{ id: 1, schedule_id: 1, campaign_id: 'camp-1', user_id: 'user-1', telefone: '11999999999', nome: 'Contato 1', mensagem: '<p>OlÃ¡</p>', status: 'pendente', tentativas: 0 }],
    userProfiles: [{ id: 'user-1', evolution_url: 'https://evolution.test', evolution_apikey: 'token', evolution_instance: 'instancia' }],
    reputation: [{ user_id: 'user-1', level: 'AQUECENDO' }],
  })

  const baseQuery = createQueryMock(state)
  const query = async (text, params = []) => {
    const sql = String(text).replace(/\s+/g, ' ').trim()
    if (sql === 'SELECT status FROM campaign_schedule WHERE id = $1 LIMIT 1') {
      state.schedules[0].status = 'cancelado'
    }
    return baseQuery(text, params)
  }

  const fetchCalls = []
  setQueueWorkerDepsForTests({
    query,
    sleepImpl: async () => {},
    fetchImpl: async (...args) => {
      fetchCalls.push(args)
      return { ok: true, text: async () => '' }
    }
  })

  await runWorker()

  assert.equal(state.queue[0].status, 'falhou')
  assert.equal(fetchCalls.length, 0)
})
