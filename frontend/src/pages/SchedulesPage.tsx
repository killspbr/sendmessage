import { useEffect, useState } from 'react'
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
    data_criacao: string
    campaign_name?: string
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

type SchedulesPageProps = {
    campaigns: Campaign[]
    effectiveUserId: string | null
}

export function SchedulesPage({ effectiveUserId }: SchedulesPageProps) {
    const [schedules, setSchedules] = useState<ProfSchedule[]>([])
    const [queue, setQueue] = useState<QueueItem[]>([])
    const [loading, setLoading] = useState(false)
    const [viewMode, setViewMode] = useState<'schedules' | 'queue'>('schedules')

    const loadData = async () => {
        if (!effectiveUserId) return
        setLoading(true)
        try {
            const [sData, qData] = await Promise.all([
                apiFetch('/api/admin/schedules'),
                apiFetch('/api/admin/queue')
            ])
            setSchedules(Array.isArray(sData.data) ? sData.data : [])
            setQueue(Array.isArray(qData.data) ? qData.data : [])
        } catch (e) {
            console.error('Erro ao carregar dados de agendamento profissional', e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        void loadData()
        const interval = setInterval(loadData, 15000) // Refresh mais rápido para monitoring
        return () => clearInterval(interval)
    }, [effectiveUserId])

    const formatDate = (iso: string) => {
        if (!iso) return '-'
        return new Date(iso).toLocaleDateString('pt-BR')
    }

    const formatTime = (iso: string) => {
        if (!iso) return '-'
        return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    }

    const handleCancel = async (campaign_id: string) => {
        if (!confirm('Deseja realmente cancelar este agendamento e limpar a fila pendente?')) return
        try {
            const res = await apiFetch(`/api/campaigns/${campaign_id}/schedule`, { method: 'DELETE' })
            if (res.success) loadData()
        } catch (err) {
            console.error('Erro ao cancelar:', err)
        }
    }

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div className="flex bg-slate-100 p-1 rounded-2xl w-fit">
                <button 
                    onClick={() => setViewMode('schedules')}
                    className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${viewMode === 'schedules' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    📅 Agendamentos Ativos
                </button>
                <button 
                    onClick={() => setViewMode('queue')}
                    className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${viewMode === 'queue' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    🚀 Monitor de Fila
                </button>
            </div>

            {viewMode === 'schedules' ? (
                <div className="grid grid-cols-1 gap-4">
                    {loading && schedules.length === 0 ? (
                        <div className="p-12 text-center text-slate-400">Carregando agendamentos...</div>
                    ) : schedules.length === 0 ? (
                        <div className="bg-white rounded-3xl p-16 text-center border border-dashed border-slate-200">
                            <span className="text-5xl mb-6 block">📅</span>
                            <h3 className="text-xl font-bold text-slate-800">Nenhum agendamento ativo</h3>
                            <p className="text-slate-500 max-w-sm mx-auto mt-2">Os envios profissionais garantem maior segurança e proteção contra bloqueios.</p>
                        </div>
                    ) : (
                        schedules.map((s) => (
                            <div key={s.id} className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:border-emerald-100 transition-all group relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 group-hover:bg-emerald-50 transition-colors" />
                                
                                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-4">
                                            <h3 className="text-xl font-bold text-slate-800">{s.campaign_name || 'Campanha sem nome'}</h3>
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm ${
                                                s.status === 'em_execucao' 
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100 animate-pulse' 
                                                    : 'bg-amber-50 text-amber-700 border-amber-100'
                                            }`}>
                                                {s.status === 'em_execucao' ? '● PROCESSANDO' : s.status}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
                                            <span>📅 {formatDate(s.data_criacao)}</span>
                                            <span>⏰ {formatTime(s.data_criacao)}</span>
                                            <span className="text-slate-300">|</span>
                                            <span className="text-slate-500">Início: <b>{s.data_inicio} {s.hora_inicio}</b></span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => handleCancel(s.campaign_id)}
                                            className="px-6 py-3 rounded-2xl bg-white border border-red-100 text-red-500 text-xs font-bold hover:bg-red-50 transition-colors shadow-sm"
                                        >
                                            Cancelar Envio
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
                                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Delays Dinâmicos</span>
                                        <span className="text-lg font-bold text-slate-700">{s.intervalo_minimo}s — {s.intervalo_maximo}s</span>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Pausa por Lote</span>
                                        <span className="text-lg font-bold text-slate-700">{s.mensagens_por_lote} msg / {s.tempo_pausa_lote} min</span>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Limite Diário</span>
                                        <span className="text-lg font-bold text-slate-700">{s.limite_diario} disparos</span>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex flex-col text-emerald-700">
                                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1">Status de Rede</span>
                                        <span className="text-lg font-bold">Iniciando...</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            ) : (
                <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-xl">
                    <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="font-bold text-slate-700 uppercase text-[10px] tracking-widest">Últimas 100 Mensagens em Fila</h3>
                        <span className="text-[10px] text-slate-400 animate-pulse">● Auto-refresh ativo</span>
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
                                    <tr key={q.id} className="hover:bg-slate-50 transition-colors group">
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
                                                    q.status === 'falhou' ? 'bg-red-50 text-red-600 border-red-100' :
                                                    q.status === 'processando' ? 'bg-sky-50 text-sky-600 border-sky-100 animate-pulse' :
                                                    'bg-slate-50 text-slate-500 border-slate-200'
                                                }`}>
                                                    {q.status}
                                                </span>
                                                {q.recovered_at && (
                                                    <span className="bg-amber-100 text-amber-700 text-[9px] font-black px-1.5 py-0.5 rounded border border-amber-200 uppercase w-fit">
                                                        ⚡ Recuperado
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
                                                    {q.data_envio ? new Date(q.data_envio).toLocaleTimeString('pt-BR') : '...'}
                                                </span>
                                                {q.processing_started_at && !q.data_envio && (
                                                    <span className="text-[9px] text-slate-400">
                                                        Iniciado: {new Date(q.processing_started_at).toLocaleTimeString('pt-BR')}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            {q.erro && (
                                                <div className="flex flex-col gap-1 max-w-[250px]">
                                                    <span className="text-[10px] text-red-400 bg-red-50 px-2 py-1 rounded-lg border border-red-100 truncate block font-medium" title={q.erro}>
                                                        {q.erro}
                                                    </span>
                                                    {q.recovery_logs && q.recovery_logs.length > 0 && (
                                                        <div className="mt-2 p-2 bg-slate-900 rounded-lg text-[8px] font-mono text-emerald-400 space-y-1">
                                                            <div className="text-white border-b border-slate-700 pb-1 mb-1 font-bold">AUDITORIA DE RECUPERAÇÃO</div>
                                                            {q.recovery_logs.map(log => {
                                                                const details = JSON.parse(log.details);
                                                                return (
                                                                    <div key={log.id} className="leading-tight">
                                                                        [{new Date(log.data_evento).toLocaleTimeString()}] {log.event === 'zombie_recovered' ? 'RETOMADA' : 'FALHA'}
                                                                        <br/>Motivo: {details.motivo}
                                                                        <br/>Tentativa: {details.tentativa_final}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {queue.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-24 text-center">
                                            <div className="flex flex-col items-center">
                                                <span className="text-4xl grayscale opacity-20 mb-4">🚀</span>
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
