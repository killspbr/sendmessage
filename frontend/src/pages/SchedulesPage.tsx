import { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '../api'
import type { Campaign } from '../types'

type ProfSchedule = {
    id: number
    campaign_id: number
    user_id: number
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
    campaign_id: number
    telefone: string
    nome: string
    status: string
    tentativas: number
    data_criacao: string
    data_envio?: string
    erro?: string
    campaign_name?: string
}

type SchedulesPageProps = {
    campaigns: Campaign[]
    effectiveUserId: string | null
}

export function SchedulesPage({ campaigns, effectiveUserId }: SchedulesPageProps) {
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
            setSchedules(sData ?? [])
            setQueue(qData ?? [])
        } catch (e) {
            console.error('Erro ao carregar dados de agendamento profissional', e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        void loadData()
        const interval = setInterval(loadData, 30000) // Auto-refresh a cada 30s
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

    return (
        <div className="space-y-6">
            <div className="flex bg-slate-100 p-1 rounded-2xl w-fit">
                <button 
                    onClick={() => setViewMode('schedules')}
                    className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${viewMode === 'schedules' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    📅 Agendamentos Pro
                </button>
                <button 
                    onClick={() => setViewMode('queue')}
                    className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${viewMode === 'queue' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    🚀 Fila de Mensagens
                </button>
            </div>

            {viewMode === 'schedules' ? (
                <div className="grid grid-cols-1 gap-4">
                    {schedules.length === 0 ? (
                        <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-200">
                            <span className="text-4xl mb-4 block">📅</span>
                            <h3 className="text-lg font-bold text-slate-800">Nenhum agendamento profissional</h3>
                            <p className="text-sm text-slate-500">Use o botão "Agendar Pro" na tela de campanhas para criar um envio seguro.</p>
                        </div>
                    ) : (
                        schedules.map((s) => (
                            <div key={s.id} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-3">
                                            <h3 className="font-bold text-slate-800">{s.campaign_name || `Campanha #${s.campaign_id}`}</h3>
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                                s.status === 'ativo' || s.status === 'em_execucao' 
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                                    : 'bg-amber-50 text-amber-700 border-amber-100'
                                            }`}>
                                                {s.status}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500">Criado em {formatDate(s.data_criacao)} às {formatTime(s.data_criacao)}</p>
                                    </div>
                                    <button 
                                        className="text-xs text-red-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity hover:underline"
                                        onClick={async () => {
                                            if (confirm('Deseja realmente cancelar este agendamento e limpar a fila?')) {
                                                await apiFetch(`/api/campaigns/${s.campaign_id}/schedule`, { method: 'DELETE' })
                                                loadData()
                                            }
                                        }}
                                    >
                                        Cancelar Envio
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
                                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Intervalo</p>
                                        <p className="text-sm font-bold text-slate-700">{s.intervalo_minimo}-{s.intervalo_maximo}s</p>
                                    </div>
                                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Lotes</p>
                                        <p className="text-sm font-bold text-slate-700">{s.mensagens_por_lote} msg</p>
                                    </div>
                                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Pausa Lote</p>
                                        <p className="text-sm font-bold text-slate-700">{s.tempo_pausa_lote} min</p>
                                    </div>
                                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Limite Dia</p>
                                        <p className="text-sm font-bold text-slate-700">{s.limite_diario} msg</p>
                                    </div>
                                    <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100">
                                        <p className="text-[10px] font-bold text-emerald-400 uppercase">Início</p>
                                        <p className="text-sm font-bold text-emerald-700">{s.data_inicio} {s.hora_inicio}</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            ) : (
                <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 font-bold text-slate-500 uppercase text-[10px]">Campanha</th>
                                <th className="px-6 py-4 font-bold text-slate-500 uppercase text-[10px]">Contato</th>
                                <th className="px-6 py-4 font-bold text-slate-500 uppercase text-[10px]">Status</th>
                                <th className="px-6 py-4 font-bold text-slate-500 uppercase text-[10px]">Data Criada</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {queue.map((q) => (
                                <tr key={q.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-700">{q.campaign_name || q.campaign_id}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-slate-800 font-medium">{q.nome || 'Sem nome'}</span>
                                            <span className="text-xs text-slate-400">{q.telefone}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                            q.status === 'enviado' ? 'bg-emerald-50 text-emerald-600' :
                                            q.status === 'falhou' ? 'bg-red-50 text-red-600' :
                                            'bg-sky-50 text-sky-600'
                                        }`}>
                                            {q.status} {q.tentativas > 0 && `(${q.tentativas})`}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-xs text-slate-400">
                                        {formatDate(q.data_criacao)} {formatTime(q.data_criacao)}
                                    </td>
                                </tr>
                            ))}
                            {queue.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">
                                        Fila de mensagens vazia.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
