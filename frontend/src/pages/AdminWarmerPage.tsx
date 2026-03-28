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
      label: 'Rodando',
      className: 'border border-emerald-200 bg-emerald-50 text-emerald-700',
    }
  }

  if (pair.active_run_status === 'queued') {
    return {
      label: 'Na fila',
      className: 'border border-sky-200 bg-sky-50 text-sky-700',
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
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-6 text-white shadow-xl shadow-slate-300/40">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-300/80">Laboratorio Admin</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">Laboratorio de Instancias</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-300">
              Use este modulo para validar conectividade, latencia e tipos de payload entre duas instancias autorizadas da
              Evolution API. Ele substitui o antigo maturador por um fluxo de QA tecnico, controlado e auditavel.
            </p>
          </div>
          <button
            type="button"
            onClick={() => (isFormOpen ? resetForm() : openCreate())}
            className="rounded-2xl border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold transition hover:bg-white/20"
          >
            {isFormOpen ? 'Fechar formulario' : 'Novo par de teste'}
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Pares</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{totals.totalPairs}</p>
        </div>
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50/70 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-600">Rodadas ativas</p>
          <p className="mt-3 text-3xl font-semibold text-emerald-900">{totals.runningPairs}</p>
        </div>
        <div className="rounded-3xl border border-sky-200 bg-sky-50/70 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-600">Eventos hoje</p>
          <p className="mt-3 text-3xl font-semibold text-sky-900">{totals.sentToday}</p>
        </div>
        <div className="rounded-3xl border border-rose-200 bg-rose-50/70 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-600">Falhas hoje</p>
          <p className="mt-3 text-3xl font-semibold text-rose-900">{totals.failedToday}</p>
        </div>
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
                Observacoes
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                  className="mt-1 min-h-[110px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none transition focus:border-emerald-500"
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
                        {pair.name || `${pair.instance_a_id} ↔ ${pair.instance_b_id}`}
                      </h2>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadge.className}`}>
                        {statusBadge.label}
                      </span>
                    </div>

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
                        Ver logs
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">Texto</span>
                  {pair.sample_image_url && (
                    <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">Imagem</span>
                  )}
                  {pair.sample_document_url && (
                    <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">Documento</span>
                  )}
                  {pair.sample_audio_url && (
                    <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">Audio</span>
                  )}
                </div>

                {pair.notes && (
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                    {pair.notes}
                  </div>
                )}
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

            <div className="overflow-y-auto px-6 py-5">
              {loadingLogs ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">Carregando logs...</div>
              ) : logs.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">Nenhum log encontrado.</div>
              ) : (
                <div className="space-y-3">
                  {logs.map((log) => (
                    <div key={log.id} className="rounded-2xl border border-slate-200 p-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${log.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                              {log.ok ? 'OK' : 'Falha'}
                            </span>
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                              {(log.payload_type || 'texto').toUpperCase()}
                            </span>
                            {log.run_status && (
                              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                                {log.run_status}
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-medium text-slate-900">
                            {log.from_instance || log.from_phone} → {log.to_instance || log.to_phone}
                          </p>
                          <p className="text-sm text-slate-600">{log.content_summary || '-'}</p>
                          {log.error_detail && <p className="text-sm text-rose-700">{log.error_detail}</p>}
                        </div>

                        <div className="grid shrink-0 gap-2 text-right text-xs text-slate-500">
                          <span>{formatDateTime(log.sent_at)}</span>
                          <span>HTTP: {log.provider_status ?? '-'}</span>
                          <span>Tempo: {log.response_time_ms != null ? `${log.response_time_ms} ms` : '-'}</span>
                          <span>Run: {log.run_id ? log.run_id.slice(0, 8) : '-'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
