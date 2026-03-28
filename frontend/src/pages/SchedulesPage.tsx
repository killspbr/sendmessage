import { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '../api'
import type { Campaign } from '../types'

type ProfSchedule = {
    id: number
    campaign_id: string
    user_id: string
    data_inicio: string
    hora_inicio: string
    limite_diario: number
    intervalo_minimo: number
    intervalo_maximo: number
    mensagens_por_lote: number
    tempo_pausa_lote: number
    status: string
    pause_reason?: string | null
    pause_details?: string | null
    paused_at?: string | null
    resumed_at?: string | null
    data_criacao: string
    campaign_name?: string
    pending_count?: number
    processing_count?: number
    sent_count?: number
    failed_count?: number
    last_error?: string | null
    last_queue_activity_at?: string | null
    last_event?: string | null
    last_event_at?: string | null
}

type QueueItem = {
    id: number
    campaign_id: string
    telefone: string
    nome: string
    status: string
    tentativas: number
    data_criacao: string
    data_envio?: string
    processing_started_at?: string
    recovered_at?: string
    erro?: string
    campaign_name?: string
    recovery_logs?: Array<{
        id: number
        event: string
        details: string
        data_evento: string
    }>
}

type ServerClock = {
    server_time?: string | null
    server_date?: string | null
    server_time_only?: string | null
    timezone?: string | null
}

type SchedulesPageProps = {
    campaigns: Campaign[]
    effectiveUserId: string | null
}

function formatDateTime(value?: string | null) {
    if (!value) return '-'
    return new Date(value).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    })
}

function parseScheduleDateTime(dateValue?: string | null, timeValue?: string | null) {
    if (!dateValue || !timeValue) return null

    const safeDate = String(dateValue).slice(0, 10)
    const safeTime = String(timeValue).slice(0, 8)
    const parsed = new Date(`${safeDate}T${safeTime}`)

    if (Number.isNaN(parsed.getTime())) return null
    return parsed
}

function formatScheduleStart(dateValue?: string | null, timeValue?: string | null) {
    const parsed = parseScheduleDateTime(dateValue, timeValue)
    if (!parsed) return '-'

    return parsed.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

function formatServerClock(clock?: ServerClock | null) {
    if (!clock?.server_date || !clock?.server_time_only) return '-'

    const [year, month, day] = String(clock.server_date).slice(0, 10).split('-')
    const time = String(clock.server_time_only).slice(0, 8)
    if (!year || !month || !day || !time) return '-'

    return `${day}/${month}/${year}, ${time}`
}

function getServerNow(clock?: ServerClock | null) {
    if (!clock?.server_date || !clock?.server_time_only) return null
    const parsed = new Date(`${String(clock.server_date).slice(0, 10)}T${String(clock.server_time_only).slice(0, 8)}`)
    return Number.isNaN(parsed.getTime()) ? null : parsed
}

function getScheduleStatusLabel(status: string) {
    if (status === 'em_execucao') return 'Em execução'
    if (status === 'preparando') return 'Preparando fila'
    if (status === 'pausado') return 'Pausado'
    if (status === 'agendado') return 'Agendado'
    if (status === 'concluido') return 'Concluído'
    if (status === 'cancelado') return 'Cancelado'
    if (status === 'erro') return 'Erro'
    return status
}

function getScheduleHealth(schedule: ProfSchedule, serverClock?: ServerClock | null) {
    const pending = Number(schedule.pending_count || 0)
    const processing = Number(schedule.processing_count || 0)
    const sent = Number(schedule.sent_count || 0)
    const failed = Number(schedule.failed_count || 0)

    if (schedule.status === 'pausado') {
        const pauseLabel = schedule.pause_reason === 'daily_limit'
            ? 'Pausado por limite diário'
            : schedule.pause_reason === 'reputation_critical'
                ? 'Pausado por reputação'
                : schedule.pause_reason === 'manual_cancel'
                    ? 'Cancelado manualmente'
                : 'Pausado com pendências'
        return {
            label: pauseLabel,
            tone: 'amber',
            detail: schedule.pause_details || schedule.last_error || 'O agendamento está pausado e aguardando retomada.',
        }
    }

    const plannedStart = parseScheduleDateTime(schedule.data_inicio, schedule.hora_inicio)
    const serverNow = getServerNow(serverClock)
    const scheduleDue = Boolean(
        plannedStart &&
        serverNow &&
        !Number.isNaN(serverNow.getTime()) &&
        plannedStart.getTime() <= serverNow.getTime()
    )

    if (schedule.status === 'agendado' && scheduleDue && pending === 0 && processing === 0 && sent === 0) {
        return {
            label: 'No horário e aguardando motor',
            tone: 'amber',
            detail: 'O horário já chegou no servidor. Use "Atualizar agora" para forçar uma nova rodada imediata do scheduler.',
        }
    }

    if (processing > 0) {
        return {
            label: 'Enviando agora',
            tone: 'emerald',
            detail: `${processing} contato(s) em processamento neste momento.`,
        }
    }

    if (failed > 0 && pending === 0 && processing === 0) {
        return {
            label: 'Concluído com falhas',
            tone: 'rose',
            detail: schedule.last_error || `${failed} envio(s) falharam durante a execução.`,
        }
    }

    if (sent > 0 && pending === 0 && processing === 0) {
        return {
            label: 'Fila concluída',
            tone: 'emerald',
            detail: 'Todos os itens atuais desta fila já foram processados.',
        }
    }

    return {
        label: 'Aguardando processamento',
        tone: 'sky',
        detail: pending > 0
            ? `${pending} contato(s) ainda aguardam envio.`
            : 'O agendamento foi criado e a fila será iniciada no horário definido.',
    }
}

function getStatusClasses(tone: string) {
    if (tone === 'emerald') return 'bg-emerald-50 text-emerald-700 border-emerald-100'
    if (tone === 'amber') return 'bg-amber-50 text-amber-700 border-amber-100'
    if (tone === 'rose') return 'bg-rose-50 text-rose-700 border-rose-100'
    return 'bg-sky-50 text-sky-700 border-sky-100'
}

export function SchedulesPage({ effectiveUserId }: SchedulesPageProps) {
    const [schedules, setSchedules] = useState<ProfSchedule[]>([])
    const [history, setHistory] = useState<ProfSchedule[]>([])
    const [queue, setQueue] = useState<QueueItem[]>([])
    const [serverClock, setServerClock] = useState<ServerClock | null>(null)
    const [loading, setLoading] = useState(false)
    const [refreshingNow, setRefreshingNow] = useState(false)
    const [viewMode, setViewMode] = useState<'schedules' | 'history' | 'queue'>('schedules')
    const [historyFilter, setHistoryFilter] = useState<'all' | 'concluido' | 'cancelado' | 'erro'>('all')

    const loadData = async () => {
        if (!effectiveUserId) return
        setLoading(true)
        try {
            const [sData, hData, qData] = await Promise.all([
                apiFetch('/api/schedules/professional'),
                apiFetch(`/api/schedules/history?status=${historyFilter}`),
                apiFetch('/api/queue/professional')
            ])
            setSchedules(Array.isArray(sData.data) ? sData.data : [])
            setHistory(Array.isArray(hData.data) ? hData.data : [])
            setQueue(Array.isArray(qData.data) ? qData.data : [])
            setServerClock(sData.server || hData.server || qData.server || null)
        } catch (e) {
            console.error('Erro ao carregar dados de agendamento profissional', e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        void loadData()
        const interval = setInterval(() => {
            void loadData()
        }, 15000)
        return () => clearInterval(interval)
    }, [effectiveUserId, historyFilter])

    const summary = useMemo(() => {
        return {
            schedules: schedules.length,
            pending: schedules.reduce((acc, item) => acc + Number(item.pending_count || 0), 0),
            processing: schedules.reduce((acc, item) => acc + Number(item.processing_count || 0), 0),
            sent: schedules.reduce((acc, item) => acc + Number(item.sent_count || 0), 0),
            failed: schedules.reduce((acc, item) => acc + Number(item.failed_count || 0), 0),
            paused: schedules.filter((item) => item.status === 'pausado').length,
        }
    }, [schedules])

    const handleCancel = async (campaign_id: string) => {
        if (!confirm('Deseja realmente cancelar este agendamento e limpar a fila pendente?')) return
        try {
            const res = await apiFetch(`/api/campaigns/${campaign_id}/schedule`, { method: 'DELETE' })
            if (res.success) void loadData()
        } catch (err) {
            console.error('Erro ao cancelar:', err)
        }
    }

    const handleRefreshNow = async () => {
        if (!effectiveUserId) return
        setRefreshingNow(true)
        try {
            const res = await apiFetch('/api/schedules/professional/refresh', { method: 'POST' })
            if (res?.server) setServerClock(res.server)
            await loadData()
        } catch (err) {
            console.error('Erro ao forçar atualização:', err)
        } finally {
            setRefreshingNow(false)
        }
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex bg-slate-100 p-1 rounded-2xl w-fit">
                        <button
                            onClick={() => setViewMode('schedules')}
                            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${viewMode === 'schedules' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Agendamentos ativos
                        </button>
                        <button
                            onClick={() => setViewMode('queue')}
                            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${viewMode === 'queue' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Monitor de fila
                        </button>
                        <button
                            onClick={() => setViewMode('history')}
                            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${viewMode === 'history' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Histórico
                        </button>
                    </div>
                    <span className="text-xs text-slate-400">{loading ? 'Atualizando dados...' : 'Atualização automática a cada 15s'}</span>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-right shadow-sm">
                        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Horário do servidor</div>
                        <div className="mt-1 text-sm font-bold text-slate-800">{formatServerClock(serverClock)}</div>
                        <div className="text-[11px] text-slate-400">{serverClock?.timezone || 'Timezone indisponível'}</div>
                    </div>
                    <button
                        onClick={() => void handleRefreshNow()}
                        disabled={refreshingNow || loading}
                        className="px-4 py-2.5 rounded-2xl bg-slate-900 text-white text-sm font-bold shadow-sm hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                    >
                        {refreshingNow ? 'Atualizando...' : 'Atualizar agora'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Agendamentos</div>
                    <div className="mt-2 text-2xl font-black text-slate-800">{summary.schedules}</div>
                </div>
                <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4">
                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-500">Pendentes</div>
                    <div className="mt-2 text-2xl font-black text-sky-800">{summary.pending}</div>
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-500">Processando</div>
                    <div className="mt-2 text-2xl font-black text-emerald-800">{summary.processing}</div>
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-white p-4">
                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Enviadas</div>
                    <div className="mt-2 text-2xl font-black text-slate-800">{summary.sent}</div>
                </div>
                <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4">
                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-rose-500">Falhas</div>
                    <div className="mt-2 text-2xl font-black text-rose-800">{summary.failed}</div>
                </div>
                <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-500">Pausados</div>
                    <div className="mt-2 text-2xl font-black text-amber-800">{summary.paused}</div>
                </div>
            </div>

            {viewMode === 'schedules' ? (
                <div className="grid grid-cols-1 gap-4">
                    {loading && schedules.length === 0 ? (
                        <div className="p-12 text-center text-slate-400">Carregando agendamentos...</div>
                    ) : schedules.length === 0 ? (
                        <div className="bg-white rounded-3xl p-16 text-center border border-dashed border-slate-200">
                            <span className="text-5xl mb-6 block">Agenda limpa</span>
                            <h3 className="text-xl font-bold text-slate-800">Nenhum agendamento ativo</h3>
                            <p className="text-slate-500 max-w-sm mx-auto mt-2">Quando houver campanhas em fila, você verá aqui o andamento real de cada uma.</p>
                        </div>
                    ) : (
                        schedules.map((s) => {
                            const health = getScheduleHealth(s, serverClock)
                            const total = Number(s.pending_count || 0) + Number(s.processing_count || 0) + Number(s.sent_count || 0) + Number(s.failed_count || 0)
                            return (
                                <div key={s.id} className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
                                    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                                        <div className="space-y-3">
                                            <div className="flex flex-wrap items-center gap-3">
                                                <h3 className="text-xl font-bold text-slate-800">{s.campaign_name || 'Campanha sem nome'}</h3>
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusClasses(health.tone)}`}>
                                                    {getScheduleStatusLabel(s.status)}
                                                </span>
                                                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-200 bg-slate-50 text-slate-600">
                                                    {health.label}
                                                </span>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500">
                                                <span>Criado em {formatDateTime(s.data_criacao)}</span>
                                                <span>Início previsto: {formatScheduleStart(s.data_inicio, s.hora_inicio)}</span>
                                                <span>Última atividade: {formatDateTime(s.last_queue_activity_at || s.last_event_at)}</span>
                                                {s.paused_at && s.status === 'pausado' && (
                                                    <span>Pausado em {formatDateTime(s.paused_at)}</span>
                                                )}
                                                {s.resumed_at && s.status === 'em_execucao' && (
                                                    <span>Retomado em {formatDateTime(s.resumed_at)}</span>
                                                )}
                                            </div>

                                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Leitura operacional</div>
                                                <div className="mt-2 text-sm font-semibold text-slate-700">{health.detail}</div>
                                                {s.last_event && (
                                                    <div className="mt-2 text-xs text-slate-500">
                                                        Último evento do motor: <span className="font-semibold text-slate-700">{s.last_event}</span>
                                                    </div>
                                                )}
                                                {s.last_error && (
                                                    <div className="mt-2 text-xs text-rose-600">
                                                        Último motivo registrado: {s.last_error}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-start gap-3 lg:items-end">
                                            <button
                                                onClick={() => handleCancel(s.campaign_id)}
                                                className="px-6 py-3 rounded-2xl bg-white border border-red-100 text-red-500 text-xs font-bold hover:bg-red-50 transition-colors shadow-sm"
                                            >
                                                Cancelar envio
                                            </button>
                                            <div className="text-xs text-slate-400">
                                                Total atual na fila: <span className="font-bold text-slate-700">{total}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-3 mt-8">
                                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pendentes</div>
                                            <div className="mt-2 text-2xl font-black text-slate-800">{Number(s.pending_count || 0)}</div>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                                            <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Processando</div>
                                            <div className="mt-2 text-2xl font-black text-emerald-800">{Number(s.processing_count || 0)}</div>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-white border border-slate-100">
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Enviadas</div>
                                            <div className="mt-2 text-2xl font-black text-slate-800">{Number(s.sent_count || 0)}</div>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100">
                                            <div className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">Falhas</div>
                                            <div className="mt-2 text-2xl font-black text-rose-800">{Number(s.failed_count || 0)}</div>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Delay</div>
                                            <div className="mt-2 text-lg font-black text-slate-800">{s.intervalo_minimo}s a {s.intervalo_maximo}s</div>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lote</div>
                                            <div className="mt-2 text-lg font-black text-slate-800">{s.mensagens_por_lote} msg</div>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pausa</div>
                                            <div className="mt-2 text-lg font-black text-slate-800">{s.tempo_pausa_lote} min</div>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Limite diário</div>
                                            <div className="mt-2 text-lg font-black text-slate-800">{s.limite_diario}</div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            ) : viewMode === 'history' ? (
                <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            onClick={() => setHistoryFilter('all')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors ${historyFilter === 'all' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'}`}
                        >
                            Todos
                        </button>
                        <button
                            onClick={() => setHistoryFilter('concluido')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors ${historyFilter === 'concluido' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-200'}`}
                        >
                            Concluídos
                        </button>
                        <button
                            onClick={() => setHistoryFilter('cancelado')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors ${historyFilter === 'cancelado' ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-slate-600 border-slate-200'}`}
                        >
                            Cancelados
                        </button>
                        <button
                            onClick={() => setHistoryFilter('erro')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors ${historyFilter === 'erro' ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-slate-600 border-slate-200'}`}
                        >
                            Com erro
                        </button>
                    </div>

                    {loading && history.length === 0 ? (
                        <div className="p-12 text-center text-slate-400">Carregando histórico...</div>
                    ) : history.length === 0 ? (
                        <div className="bg-white rounded-3xl p-16 text-center border border-dashed border-slate-200">
                            <span className="text-5xl mb-6 block">Histórico vazio</span>
                            <h3 className="text-xl font-bold text-slate-800">Nenhum agendamento encontrado</h3>
                            <p className="text-slate-500 max-w-sm mx-auto mt-2">Quando campanhas forem concluídas, canceladas ou terminarem com erro, elas aparecerão aqui.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {history.map((s) => {
                                const total = Number(s.pending_count || 0) + Number(s.processing_count || 0) + Number(s.sent_count || 0) + Number(s.failed_count || 0)
                                const tone =
                                    s.status === 'concluido' ? 'emerald' :
                                    s.status === 'cancelado' ? 'amber' :
                                    'rose'
                                return (
                                    <div key={s.id} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                            <div className="space-y-2">
                                                <div className="flex flex-wrap items-center gap-3">
                                                    <h3 className="text-lg font-bold text-slate-800">{s.campaign_name || 'Campanha sem nome'}</h3>
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusClasses(tone)}`}>
                                                        {getScheduleStatusLabel(s.status)}
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                                                    <span>Criado em {formatDateTime(s.data_criacao)}</span>
                                                    <span>Última atividade: {formatDateTime(s.last_queue_activity_at || s.last_event_at)}</span>
                                                    {s.paused_at && <span>Pausado em {formatDateTime(s.paused_at)}</span>}
                                                    {s.resumed_at && <span>Retomado em {formatDateTime(s.resumed_at)}</span>}
                                                </div>
                                                <div className="text-sm text-slate-600">
                                                    {s.pause_details || s.last_error || 'Sem observações adicionais registradas.'}
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3 min-w-[240px]">
                                                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                                                    <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total</div>
                                                    <div className="mt-1 text-xl font-black text-slate-800">{total}</div>
                                                </div>
                                                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3">
                                                    <div className="text-[10px] uppercase font-bold tracking-wider text-emerald-500">Enviadas</div>
                                                    <div className="mt-1 text-xl font-black text-emerald-800">{Number(s.sent_count || 0)}</div>
                                                </div>
                                                <div className="rounded-2xl border border-rose-100 bg-rose-50 p-3">
                                                    <div className="text-[10px] uppercase font-bold tracking-wider text-rose-500">Falhas</div>
                                                    <div className="mt-1 text-xl font-black text-rose-800">{Number(s.failed_count || 0)}</div>
                                                </div>
                                                <div className="rounded-2xl border border-slate-100 bg-white p-3">
                                                    <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Evento</div>
                                                    <div className="mt-1 text-sm font-bold text-slate-700">{s.last_event || '-'}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-xl">
                    <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="font-bold text-slate-700 uppercase text-[10px] tracking-widest">Últimas 100 mensagens em fila</h3>
                        <span className="text-[10px] text-slate-400">Auto-refresh ativo</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-4 font-bold text-slate-400 uppercase text-[10px]">Campanha</th>
                                    <th className="px-6 py-4 font-bold text-slate-400 uppercase text-[10px]">Destinatário</th>
                                    <th className="px-6 py-4 font-bold text-slate-400 uppercase text-[10px]">Status</th>
                                    <th className="px-6 py-4 font-bold text-slate-400 uppercase text-[10px]">Envio</th>
                                    <th className="px-6 py-4 font-bold text-slate-400 uppercase text-[10px]">Info</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {queue.map((q) => (
                                    <tr key={q.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-5">
                                            <span className="font-bold text-slate-700">{q.campaign_name || 'Agendamento'}</span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-900">{q.nome || 'Sem nome'}</span>
                                                <span className="text-xs text-slate-400 font-mono tracking-tighter">{q.telefone}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col gap-1">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border w-fit ${
                                                    q.status === 'enviado' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                    q.status === 'falhou' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                    q.status === 'processando' ? 'bg-sky-50 text-sky-600 border-sky-100' :
                                                    'bg-slate-50 text-slate-500 border-slate-200'
                                                }`}>
                                                    {q.status}
                                                </span>
                                                {q.recovered_at && (
                                                    <span className="bg-amber-100 text-amber-700 text-[9px] font-black px-1.5 py-0.5 rounded border border-amber-200 uppercase w-fit">
                                                        Recuperado
                                                    </span>
                                                )}
                                                {q.tentativas > 0 && (
                                                    <span className="text-[9px] text-slate-400 font-bold uppercase">
                                                        Tentativas: {q.tentativas}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-xs">
                                            <div className="flex flex-col">
                                                <span className="text-slate-700 font-bold">
                                                    {q.data_envio ? formatDateTime(q.data_envio) : '-'}
                                                </span>
                                                {q.processing_started_at && !q.data_envio && (
                                                    <span className="text-[11px] text-slate-400">
                                                        Iniciado: {formatDateTime(q.processing_started_at)}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            {q.erro ? (
                                                <div className="flex flex-col gap-1 max-w-[320px]">
                                                    <span className="text-[10px] text-rose-500 bg-rose-50 px-2 py-1 rounded-lg border border-rose-100 block font-medium whitespace-normal">
                                                        {q.erro}
                                                    </span>
                                                    {q.recovery_logs && q.recovery_logs.length > 0 && (
                                                        <div className="mt-2 p-2 bg-slate-900 rounded-lg text-[8px] font-mono text-emerald-400 space-y-1">
                                                            <div className="text-white border-b border-slate-700 pb-1 mb-1 font-bold">Auditoria de recuperação</div>
                                                            {q.recovery_logs.map((log) => {
                                                                const details = JSON.parse(log.details)
                                                                return (
                                                                    <div key={log.id} className="leading-tight">
                                                                        [{new Date(log.data_evento).toLocaleTimeString('pt-BR')}] {log.event === 'zombie_recovered' ? 'RETOMADA' : 'FALHA'}
                                                                        <br />Motivo: {details.motivo}
                                                                        <br />Tentativa: {details.tentativa_final}
                                                                    </div>
                                                                )
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-400">Sem alerta</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {queue.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-24 text-center">
                                            <div className="flex flex-col items-center">
                                                <span className="text-4xl grayscale opacity-20 mb-4">Fila vazia</span>
                                                <p className="text-slate-400 italic">Nenhuma mensagem em processamento agora.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}
