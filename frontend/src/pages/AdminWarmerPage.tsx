import { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '../api'

type InstanceLabPair = {
  id: string
  name?: string | null
  instance_a_id: string
  instance_b_id: string
  phone_a: string
  phone_b: string
  status: 'active' | 'paused' | 'error'
  default_delay_seconds?: number
  default_messages_per_run?: number
  sample_image_url?: string | null
  sample_document_url?: string | null
  sample_audio_url?: string | null
  notes?: string | null
  sent_today?: number
  failed_today?: number
  active_run_id?: string | null
  active_run_status?: 'queued' | 'running' | null
  active_run_steps_total?: number | null
  active_run_steps_completed?: number | null
  last_run_status?: string | null
  last_run_status_actual?: string | null
  last_run_error?: string | null
  last_run_error_actual?: string | null
  last_run_at?: string | null
  last_run_finished_at?: string | null
  ai_persona?: string | null
  night_mode_enabled?: boolean
  night_mode_start?: string
  night_mode_end?: string
}

type InstanceLabLog = {
  id: string
  from_phone: string
  to_phone: string
  from_instance?: string | null
  to_instance?: string | null
  payload_type?: string | null
  content_summary?: string | null
  ok?: boolean
  provider_status?: number | null
  response_time_ms?: number | null
  error_detail?: string | null
  sent_at: string
  run_id?: string | null
  run_status?: string | null
}

type InstanceLabForm = {
  name: string
  instance_a_id: string
  phone_a: string
  instance_b_id: string
  phone_b: string
  default_delay_seconds: number
  default_messages_per_run: number
  sample_image_url: string
  sample_document_url: string
  sample_audio_url: string
  notes: string
  ai_persona: string
  night_mode_enabled: boolean
  night_mode_start: string
  night_mode_end: string
}

const EMPTY_FORM: InstanceLabForm = {
  name: '',
  instance_a_id: '',
  phone_a: '',
  instance_b_id: '',
  phone_b: '',
  default_delay_seconds: 5,
  default_messages_per_run: 4,
  sample_image_url: '',
  sample_document_url: '',
  sample_audio_url: '',
  notes: '',
  ai_persona: 'participando de uma conversa informal e rápida para validar a conexão',
  night_mode_enabled: true,
  night_mode_start: '22:00',
  night_mode_end: '07:00',
}

function formatDateTime(value?: string | null) {
  if (!value) return '-'
  try {
    return new Date(value).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return value
  }
}

function getStatusBadge(pair: InstanceLabPair) {
  if (pair.active_run_status === 'running') {
    return {
      label: 'Executando',
      className: 'border border-emerald-200 bg-emerald-50 text-emerald-700 animate-pulse',
      icon: '⚡'
    }
  }

  if (pair.active_run_status === 'queued') {
    return {
      label: 'Na fila',
      className: 'border border-sky-200 bg-sky-50 text-sky-700',
      icon: '🕒'
    }
  }

  if (pair.status === 'paused') {
    return {
      label: 'Pausado',
      className: 'border border-amber-200 bg-amber-50 text-amber-700',
    }
  }

  if (pair.status === 'error' || pair.last_run_status_actual === 'failed') {
    return {
      label: 'Com erro',
      className: 'border border-rose-200 bg-rose-50 text-rose-700',
    }
  }

  return {
    label: 'Ativo',
    className: 'border border-emerald-200 bg-emerald-50 text-emerald-700',
  }
}

export function AdminWarmerPage({ can }: { can?: (code: string) => boolean }) {
  const [pairs, setPairs] = useState<InstanceLabPair[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<InstanceLabForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [logsModalId, setLogsModalId] = useState<string | null>(null)
  const [logs, setLogs] = useState<InstanceLabLog[]>([])
  const [loadingLogs, setLoadingLogs] = useState(false)
  const [busyAction, setBusyAction] = useState<string | null>(null)
  const [expandedChatId, setExpandedChatId] = useState<string | null>(null)
  const [recentPairLogs, setRecentPairLogs] = useState<Record<string, InstanceLabLog[]>>({})

  const totals = useMemo(() => {
    return pairs.reduce(
      (acc, pair) => {
        acc.totalPairs += 1
        acc.sentToday += Number(pair.sent_today || 0)
        acc.failedToday += Number(pair.failed_today || 0)
        if (pair.active_run_status === 'queued' || pair.active_run_status === 'running') {
          acc.runningPairs += 1
        }
        return acc
      },
      { totalPairs: 0, runningPairs: 0, sentToday: 0, failedToday: 0 }
    )
  }, [pairs])

  const resetForm = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setIsFormOpen(false)
  }

  const toggleChat = async (pairId: string) => {
    if (expandedChatId === pairId) {
      setExpandedChatId(null)
      return
    }

    setExpandedChatId(pairId)
    if (!recentPairLogs[pairId]) {
      try {
        const data = await apiFetch<InstanceLabLog[]>(`/api/admin/warmer/${pairId}/logs?limit=5`)
        setRecentPairLogs(prev => ({ ...prev, [pairId]: data }))
      } catch (err) {
        console.error('Erro ao carregar logs curtos:', err)
      }
    }
  }

  const loadPairs = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true)
        setError(null)
      }
      const data = await apiFetch('/api/admin/warmer')
      setPairs(Array.isArray(data) ? data : [])
    } catch (e: any) {
      if (!silent) setError(e.message || 'Erro ao carregar o laboratorio.')
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => {
    void loadPairs()
    const timer = setInterval(() => {
      void loadPairs(true)
    }, 15000)
    return () => clearInterval(timer)
  }, [])

  const startEdit = (pair: InstanceLabPair) => {
    setEditingId(pair.id)
    setForm({
      name: pair.name || '',
      instance_a_id: pair.instance_a_id,
      phone_a: pair.phone_a,
      instance_b_id: pair.instance_b_id,
      phone_b: pair.phone_b,
      default_delay_seconds: Number(pair.default_delay_seconds || 5),
      default_messages_per_run: Number(pair.default_messages_per_run || 4),
      sample_image_url: pair.sample_image_url || '',
      sample_document_url: pair.sample_document_url || '',
      sample_audio_url: pair.sample_audio_url || '',
      notes: pair.notes || '',
      ai_persona: pair.ai_persona || 'participando de uma conversa informal e rápida para validar a conexão',
      night_mode_enabled: pair.night_mode_enabled ?? true,
      night_mode_start: pair.night_mode_start || '22:00',
      night_mode_end: pair.night_mode_end || '07:00',
    })
    setIsFormOpen(true)
    setFeedback(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const openCreate = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setIsFormOpen(true)
    setFeedback(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setFeedback(null)

      if (!form.instance_a_id || !form.instance_b_id || !form.phone_a || !form.phone_b) {
        setFeedback('Preencha instancias e telefones dos dois lados.')
        return
      }

      const endpoint = editingId ? `/api/admin/warmer/${editingId}` : '/api/admin/warmer'
      const method = editingId ? 'PUT' : 'POST'

      await apiFetch(endpoint, {
        method,
        body: JSON.stringify(form),
      })

      await loadPairs()
      setFeedback(editingId ? 'Par atualizado com sucesso.' : 'Par do laboratorio criado com sucesso.')
      resetForm()
    } catch (e: any) {
      setFeedback(e.message || 'Erro ao salvar o par.')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleStatus = async (pair: InstanceLabPair) => {
    const actionKey = `${pair.id}-status`
    try {
      setBusyAction(actionKey)
      setFeedback(null)
      await apiFetch(`/api/admin/warmer/${pair.id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: pair.status === 'active' ? 'paused' : 'active' }),
      })
      await loadPairs(true)
    } catch (e: any) {
      setFeedback(e.message || 'Erro ao alterar o status do par.')
    } finally {
      setBusyAction(null)
    }
  }

  const handleStartRun = async (pairId: string) => {
    const actionKey = `${pairId}-run`
    try {
      setBusyAction(actionKey)
      setFeedback(null)
      await apiFetch(`/api/admin/warmer/${pairId}/force`, { method: 'POST' })
      setFeedback('Rodada de teste iniciada. O laboratorio vai registrar os eventos em segundo plano.')
      await loadPairs(true)
    } catch (e: any) {
      setFeedback(e.message || 'Erro ao iniciar a rodada de teste.')
    } finally {
      setBusyAction(null)
    }
  }

  const handleManual = async (pairId: string, side: 'a' | 'b') => {
    const actionKey = `${pairId}-${side}`
    try {
      setBusyAction(actionKey)
      setFeedback(null)
      await apiFetch(`/api/admin/warmer/${pairId}/manual`, {
        method: 'POST',
        body: JSON.stringify({ side }),
      })
      setFeedback(`Envio manual ${side.toUpperCase()} iniciado com sucesso.`)
      await loadPairs(true)
    } catch (e: any) {
      setFeedback(e.message || 'Erro ao iniciar o envio manual.')
    } finally {
      setBusyAction(null)
    }
  }

  const openLogs = async (pairId: string) => {
    setLogsModalId(pairId)
    setLogs([])
    setLoadingLogs(true)
    try {
      const data = await apiFetch(`/api/admin/warmer/${pairId}/logs`)
      setLogs(Array.isArray(data) ? data : [])
    } catch (e: any) {
      setFeedback(e.message || 'Erro ao carregar os logs do laboratorio.')
    } finally {
      setLoadingLogs(false)
    }
  }

  if (can && !can('admin.users')) {
    return (
      <section className="p-5">
        <p>Acesso negado.</p>
      </section>
    )
  }

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 pb-12">
      <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-slate-950 p-8 text-white shadow-2xl">
        <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-emerald-500/20 blur-[100px]" />
        <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-sky-500/10 blur-[100px]" />
        
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-400/90">Sistema de Maturação</p>
            </div>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-white">Laboratório de Instâncias</h1>
            <p className="mt-3 max-w-2xl text-base text-slate-400 leading-relaxed">
              Maturador inteligente com padrões humanos (Antiban). Valide latência, entregabilidade e mantenha o aquecimento dos seus chips através de interações simuladas entre instâncias.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => (isFormOpen ? resetForm() : openCreate())}
              className="group flex items-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-bold text-slate-950 transition-all hover:scale-[1.02] active:scale-95"
            >
              <span className="text-lg">{isFormOpen ? '✕' : '+'}</span>
              {isFormOpen ? 'Fechar Ajustes' : 'Novo Par de Maturação'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: 'Pares Configurados', value: totals.totalPairs, color: 'slate' },
          { label: 'Ativos agora', value: totals.runningPairs, color: 'emerald' },
          { label: 'Envios hoje', value: totals.sentToday, color: 'sky' },
          { label: 'Falhas detectadas', value: totals.failedToday, color: 'rose' },
        ].map((stat, i) => (
          <div key={i} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{stat.label}</p>
            <p className={`mt-3 text-3xl font-bold text-${stat.color}-600`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {feedback && (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
          {feedback}
        </div>
      )}

      {isFormOpen && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">{editingId ? 'Editar par do laboratorio' : 'Novo par do laboratorio'}</h2>
            <p className="mt-1 text-sm text-slate-500">
              Configure o par de instancias e os payloads opcionais que farao parte da rodada de teste.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <label className="block text-sm font-medium text-slate-700">
                Nome do par
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none transition focus:border-emerald-500"
                  placeholder="Ex: QA Distribuidora A/B"
                />
              </label>

              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="mb-3 text-sm font-semibold text-slate-800">Lado A</p>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={form.instance_a_id}
                    onChange={(e) => setForm((prev) => ({ ...prev, instance_a_id: e.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none transition focus:border-emerald-500"
                    placeholder="Nome da instancia A"
                  />
                  <input
                    type="text"
                    value={form.phone_a}
                    onChange={(e) => setForm((prev) => ({ ...prev, phone_a: e.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none transition focus:border-emerald-500"
                    placeholder="Telefone A com DDI"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="mb-3 text-sm font-semibold text-slate-800">Lado B</p>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={form.instance_b_id}
                    onChange={(e) => setForm((prev) => ({ ...prev, instance_b_id: e.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none transition focus:border-emerald-500"
                    placeholder="Nome da instancia B"
                  />
                  <input
                    type="text"
                    value={form.phone_b}
                    onChange={(e) => setForm((prev) => ({ ...prev, phone_b: e.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none transition focus:border-emerald-500"
                    placeholder="Telefone B com DDI"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm font-medium text-slate-700">
                  Delay entre etapas (s)
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={form.default_delay_seconds}
                    onChange={(e) => setForm((prev) => ({ ...prev, default_delay_seconds: Number(e.target.value || 1) }))}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none transition focus:border-emerald-500"
                  />
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Mensagens por rodada
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={form.default_messages_per_run}
                    onChange={(e) => setForm((prev) => ({ ...prev, default_messages_per_run: Number(e.target.value || 1) }))}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none transition focus:border-emerald-500"
                  />
                </label>
              </div>

              <label className="block text-sm font-medium text-slate-700">
                URL de imagem de teste
                <input
                  type="text"
                  value={form.sample_image_url}
                  onChange={(e) => setForm((prev) => ({ ...prev, sample_image_url: e.target.value }))}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none transition focus:border-emerald-500"
                  placeholder="https://..."
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                URL de documento de teste
                <input
                  type="text"
                  value={form.sample_document_url}
                  onChange={(e) => setForm((prev) => ({ ...prev, sample_document_url: e.target.value }))}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none transition focus:border-emerald-500"
                  placeholder="https://.../arquivo.pdf"
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                URL de audio de teste
                <input
                  type="text"
                  value={form.sample_audio_url}
                  onChange={(e) => setForm((prev) => ({ ...prev, sample_audio_url: e.target.value }))}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none transition focus:border-emerald-500"
                  placeholder="https://.../audio.mp3"
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Persona da IA (Contexto)
                <textarea
                  value={form.ai_persona}
                  onChange={(e) => setForm((prev) => ({ ...prev, ai_persona: e.target.value }))}
                  className="mt-1 min-h-[80px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none transition focus:border-emerald-500"
                  placeholder="Ex: participando de uma conversa informal sobre futebol entre amigos."
                />
              </label>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Modo Noturno (Repouso)</p>
                    <p className="text-xs text-slate-500">Pausa as atividades automáticas neste intervalo.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm(p => ({ ...p, night_mode_enabled: !p.night_mode_enabled }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.night_mode_enabled ? 'bg-emerald-600' : 'bg-slate-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.night_mode_enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>

                {form.night_mode_enabled && (
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <label className="block text-xs font-medium text-slate-600">
                      Início (Dormir)
                      <input
                        type="time"
                        value={form.night_mode_start}
                        onChange={(e) => setForm(p => ({ ...p, night_mode_start: e.target.value }))}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500"
                      />
                    </label>
                    <label className="block text-xs font-medium text-slate-600">
                      Fim (Acordar)
                      <input
                        type="time"
                        value={form.night_mode_end}
                        onChange={(e) => setForm(p => ({ ...p, night_mode_end: e.target.value }))}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500"
                      />
                    </label>
                  </div>
                )}
              </div>

              <label className="block text-sm font-medium text-slate-700">
                Observacoes
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                  className="mt-1 min-h-[80px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none transition focus:border-emerald-500"
                  placeholder="Anote objetivo do par, payloads habilitados ou restricoes."
                />
              </label>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={resetForm}
              className="rounded-2xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving}
              className="rounded-2xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Salvando...' : editingId ? 'Salvar alteracoes' : 'Criar par'}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">
          Carregando laboratorio...
        </div>
      ) : pairs.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Nenhum par configurado</h2>
          <p className="mt-2 text-sm text-slate-500">
            Crie o primeiro par de teste para validar texto, imagem, documento e audio entre instancias autorizadas.
          </p>
          <button
            type="button"
            onClick={openCreate}
            className="mt-5 rounded-2xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Criar primeiro par
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {pairs.map((pair) => {
            const statusBadge = getStatusBadge(pair)
            const progressTotal = Number(pair.active_run_steps_total || 0)
            const progressDone = Number(pair.active_run_steps_completed || 0)

            return (
              <article key={pair.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-xl font-semibold text-slate-900">
                        {pair.name || 'Sem nome' || `${pair.instance_a_id} ↔ ${pair.instance_b_id}`}
                      </h2>
                      <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${statusBadge.className}`}>
                        <span>{statusBadge.icon}</span>
                        {statusBadge.label}
                      </span>
                    </div>

                    {pair.active_run_id && (
                      <div className="mt-4 overflow-hidden rounded-full bg-slate-100 p-1">
                        <div className="relative h-2 rounded-full bg-emerald-100">
                          <div 
                            className="absolute inset-y-0 left-0 rounded-full bg-emerald-500 transition-all duration-700 ease-out"
                            style={{ width: `${(progressDone / (progressTotal || 1)) * 100}%` }}
                          />
                        </div>
                        <div className="mt-2 flex justify-between px-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          <span>Progresso: {progressDone}/{progressTotal} mensagens</span>
                          <span>{Math.round((progressDone / (progressTotal || 1)) * 100)}%</span>
                        </div>
                      </div>
                    )}

                    <div className="grid gap-3 text-sm text-slate-600 md:grid-cols-2">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Lado A</p>
                        <p className="mt-2 font-medium text-slate-900">{pair.instance_a_id}</p>
                        <p className="mt-1">{pair.phone_a}</p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Lado B</p>
                        <p className="mt-2 font-medium text-slate-900">{pair.instance_b_id}</p>
                        <p className="mt-1">{pair.phone_b}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 xl:justify-end">
                    <button
                      type="button"
                      onClick={() => void handleStartRun(pair.id)}
                      disabled={busyAction === `${pair.id}-run`}
                      className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {busyAction === `${pair.id}-run` ? 'Iniciando...' : 'Iniciar rodada'}
                    </button>
                    <button
                      type="button"
                      onClick={() => startEdit(pair)}
                      className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleToggleStatus(pair)}
                      disabled={busyAction === `${pair.id}-status`}
                      className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {pair.status === 'active' ? 'Pausar' : 'Ativar'}
                    </button>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-4">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Delay</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">{Number(pair.default_delay_seconds || 5)}s</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Rodada</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">{Number(pair.default_messages_per_run || 4)}</p>
                  </div>
                  <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-500">Eventos hoje</p>
                    <p className="mt-2 text-2xl font-semibold text-sky-900">{Number(pair.sent_today || 0)}</p>
                  </div>
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-500">Falhas</p>
                    <p className="mt-2 text-2xl font-semibold text-rose-900">{Number(pair.failed_today || 0)}</p>
                  </div>
                </div>

                <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Execucao</p>
                      <p className="text-sm text-slate-600">
                        Ultima rodada: <span className="font-medium text-slate-900">{formatDateTime(pair.last_run_at || pair.last_run_finished_at)}</span>
                      </p>
                      <p className="text-sm text-slate-600">
                        Status final: <span className="font-medium text-slate-900">{pair.last_run_status_actual || pair.last_run_status || '-'}</span>
                      </p>
                      {pair.active_run_id && (
                        <p className="text-sm text-slate-600">
                          Progresso atual:{' '}
                          <span className="font-medium text-slate-900">
                            {progressDone}/{progressTotal || 0}
                          </span>
                        </p>
                      )}
                      {(pair.last_run_error_actual || pair.last_run_error) && (
                        <p className="max-w-3xl text-sm text-rose-700">
                          {pair.last_run_error_actual || pair.last_run_error}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => toggleChat(pair.id)}
                        className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition ${expandedChatId === pair.id ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'}`}
                      >
                        {expandedChatId === pair.id ? 'Fechar Chat' : 'Monitorar Chat'}
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleManual(pair.id, 'a')}
                        disabled={busyAction === `${pair.id}-a`}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {busyAction === `${pair.id}-a` ? 'Enviando...' : 'Teste A → B'}
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleManual(pair.id, 'b')}
                        disabled={busyAction === `${pair.id}-b`}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {busyAction === `${pair.id}-b` ? 'Enviando...' : 'Teste B → A'}
                      </button>
                      <button
                        type="button"
                        onClick={() => void openLogs(pair.id)}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                      >
                        Ver logs full
                      </button>
                    </div>
                  </div>

                  {expandedChatId === pair.id && (
                    <div className="mt-6 border-t border-slate-200 pt-6 animate-in fade-in slide-in-from-top-4 duration-300">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Mensagens Recentes</h4>
                        <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      </div>
                      
                      <div className="flex flex-col gap-3">
                        {!recentPairLogs[pair.id] || recentPairLogs[pair.id].length === 0 ? (
                          <p className="text-center py-4 text-xs font-medium text-slate-400 bg-white rounded-2xl border border-slate-100">
                            Nenhuma atividade recente registrada.
                          </p>
                        ) : (
                          recentPairLogs[pair.id].map((log) => {
                            const isFromA = log.from_phone === pair.phone_a
                            return (
                              <div key={log.id} className={`flex flex-col ${isFromA ? 'items-start' : 'items-end'}`}>
                                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 shadow-sm text-xs ${isFromA ? 'bg-white border border-slate-200 text-slate-800 rounded-bl-none' : 'bg-emerald-600 text-white rounded-br-none shadow-emerald-100'}`}>
                                  {log.content_summary}
                                </div>
                                <span className="mt-1 px-1 text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                                  {formatDateTime(log.sent_at)}
                                </span>
                              </div>
                            )
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600">Texto Inteligente</span>
                  {pair.sample_image_url && (
                    <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-sky-700">Imagens</span>
                  )}
                  {pair.sample_document_url && (
                    <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700">Documentos</span>
                  )}
                  {pair.sample_audio_url && (
                    <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-violet-700">Audio</span>
                  )}
                  {pair.night_mode_enabled && (
                    <span className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1">
                      <span>🌙</span> Repouso: {pair.night_mode_start} - {pair.night_mode_end}
                    </span>
                  )}
                </div>

                <div className="mt-4 flex flex-col gap-3">
                  {pair.ai_persona && (
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 px-4 py-3 text-xs text-slate-700">
                      <p className="mb-1 font-bold uppercase tracking-wider text-emerald-700 opacity-70">Persona da IA</p>
                      {pair.ai_persona}
                    </div>
                  )}
                  {pair.notes && (
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600">
                      <p className="mb-1 font-bold uppercase tracking-wider text-slate-400 opacity-70">Observações</p>
                      {pair.notes}
                    </div>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}

      {logsModalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="flex max-h-[85vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Logs do laboratorio</h2>
                <p className="mt-1 text-sm text-slate-500">Ultimos 200 eventos do par selecionado.</p>
              </div>
              <button
                type="button"
                onClick={() => setLogsModalId(null)}
                className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Fechar
              </button>
            </div>

            <div className="overflow-y-auto px-6 py-8 bg-slate-50">
              {loadingLogs ? (
                <div className="flex items-center justify-center p-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
                </div>
              ) : logs.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
                  <p className="text-sm text-slate-400 font-medium">Nenhuma mensagem registrada ainda para este par.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {logs.map((log) => {
                    const isFromA = log.from_phone === pairs.find(p => p.id === logsModalId)?.phone_a
                    return (
                      <div 
                        key={log.id} 
                        className={`flex flex-col ${isFromA ? 'items-start' : 'items-end'}`}
                      >
                        <div className={`
                          max-w-[80%] rounded-2xl px-5 py-3 shadow-sm ring-1 ring-slate-200/50
                          ${isFromA 
                             ? 'bg-white text-slate-800 rounded-bl-sm' 
                             : 'bg-emerald-600 text-white rounded-br-sm shadow-emerald-200/30'}
                        `}>
                          <div className="flex items-center gap-2 mb-1 opacity-60 text-[10px] font-bold uppercase tracking-wider">
                            <span>{isFromA ? 'Instância A' : 'Instância B'}</span>
                            <span>•</span>
                            <span>{log.payload_type || 'texto'}</span>
                          </div>
                          <p className="text-sm leading-relaxed">{log.content_summary || '-'}</p>
                          {log.error_detail && (
                            <div className="mt-2 text-[10px] bg-rose-500/10 text-rose-300 px-2 py-1 rounded-lg">
                              Erro: {log.error_detail}
                            </div>
                          )}
                        </div>
                        <div className="mt-1 px-1 flex gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          <span>{formatDateTime(log.sent_at)}</span>
                          {log.response_time_ms && <span>{log.response_time_ms}ms</span>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
