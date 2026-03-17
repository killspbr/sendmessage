import { useState, useEffect } from 'react'
import { apiFetch } from '../api'

export default function SecurityDashboardPage() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState<any[]>([])

  const loadData = async () => {
    try {
      const [statsRes, lastMsgsRes] = await Promise.all([
        apiFetch('/api/admin/operational-stats'),
        apiFetch('/api/admin/queue')
      ])
      
      setStats(statsRes.data)
      setLogs(Array.isArray(lastMsgsRes.data) ? lastMsgsRes.data.slice(0, 10) : [])
    } catch (error) {
      console.error('Erro no Dashboard de Segurança:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading && !stats) return <div className="p-8 text-center text-slate-400">Carregando painel de segurança...</div>

  // Cálculo de Reputação (Simulado/Início do Backend)
  const getReputationLevel = () => {
    const sent = stats?.enviadas_hoje || 0
    if (sent > 200) return { label: 'ESTÁVEL', color: 'text-emerald-600', bg: 'bg-emerald-50', bar: 'bg-emerald-500', icon: '✅', score: 85 }
    if (sent > 50) return { label: 'AQUECENDO', color: 'text-blue-600', bg: 'bg-blue-50', bar: 'bg-blue-500', icon: '🔥', score: 60 }
    return { label: 'NOVO', color: 'text-slate-600', bg: 'bg-slate-50', bar: 'bg-slate-400', icon: '🌱', score: 40 }
  }

  const reputation = getReputationLevel()

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
      {/* Header com Reputação */}
      <header className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Segurança Operacional</h1>
          <p className="text-slate-500 font-medium">Monitoramento de saúde da conta e proteção anti-bloqueio.</p>
        </div>
        
        <div className={`flex items-center gap-4 p-4 rounded-3xl ${reputation.bg} border border-white shadow-sm ring-1 ring-slate-100`}>
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reputação do Número</span>
            <span className={`text-xl font-black ${reputation.color}`}>{reputation.icon} {reputation.label}</span>
          </div>
          <div className="w-24 h-3 bg-slate-200/50 rounded-full overflow-hidden border border-white">
            <div className={`h-full ${reputation.bar} transition-all duration-1000`} style={{ width: `${reputation.score}%` }} />
          </div>
        </div>
      </header>

      {/* Grid Principal */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         <div className="p-6 rounded-[2rem] bg-indigo-600 text-white shadow-xl shadow-indigo-100 flex flex-col justify-between h-40">
           <span className="text-xs font-bold text-indigo-100 uppercase opacity-60">Enviadas Hoje</span>
           <div className="flex flex-col">
             <span className="text-4xl font-black tracking-tighter">{stats?.enviadas_hoje || 0}</span>
             <span className="text-[10px] font-bold opacity-80 uppercase mt-1">Mensagens com sucesso</span>
           </div>
         </div>
         <div className="p-6 rounded-[2rem] bg-white border border-slate-100 shadow-sm flex flex-col justify-between h-40">
           <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Última Hora</span>
           <div className="flex flex-col">
             <span className="text-4xl font-black text-slate-800 tracking-tighter">{stats?.enviadas_ultima_hora || 0}</span>
             <span className="text-[10px] font-bold text-emerald-500 uppercase mt-1">Ritmo operacional seguro</span>
           </div>
         </div>
         <div className="p-6 rounded-[2rem] bg-white border border-slate-100 shadow-sm flex flex-col justify-between h-40">
           <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Erros/Falhas</span>
           <div className="flex flex-col">
             <span className="text-4xl font-black text-red-500 tracking-tighter">{stats?.falhas_hoje || 0}</span>
             <span className="text-[10px] font-bold text-slate-400 uppercase mt-1">Taxa de erro {(stats?.falhas_hoje / (stats?.enviadas_hoje || 1) * 100).toFixed(1)}%</span>
           </div>
         </div>
         <div className="p-6 rounded-[2rem] bg-slate-900 text-white shadow-xl flex flex-col justify-between h-40">
           <span className="text-xs font-bold text-slate-500 uppercase">Fila Pendente</span>
           <div className="flex flex-col">
             <span className="text-4xl font-black tracking-tighter">{stats?.fila_pendente || 0}</span>
             <span className="text-[10px] font-bold text-emerald-400 uppercase mt-1">Aguardando worker</span>
           </div>
         </div>
      </div>

      {/* Seção de IA e Saúde */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="space-y-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">Saúde das APIs Gemini</h3>
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-800">Cota Diária Projetada</p>
                <p className="text-2xl font-black text-slate-900">{stats?.ai?.requestsToday || 0} / {(stats?.ai?.activeKeys || 0) * 20}</p>
              </div>
              <div className="text-right">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest border ${stats?.ai?.activeKeys > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                  {stats?.ai?.activeKeys > 0 ? 'ESTADO ÓTIMO' : 'SEM CHAVES'}
                </span>
              </div>
            </div>
            <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden border border-white shadow-inner">
               <div 
                 className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-1000" 
                 style={{ width: `${Math.min(100, (stats?.ai?.requestsToday / ((stats?.ai?.activeKeys || 1) * 20)) * 100)}%` }}
               />
            </div>
            <p className="text-xs text-slate-400 font-medium">O sistema rotaciona entre {stats?.ai?.activeKeys} chaves ativas automaticamente.</p>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">Log Operacional (Últimas 10)</h3>
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <tbody className="divide-y divide-slate-50 block p-2">
              {logs.map((log, i) => (
                <div key={i} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors rounded-2xl">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-800">Envio para {log.telefone}</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">{log.status}</span>
                  </div>
                  <span className="text-xs font-mono text-slate-300">
                    {new Date(log.data_envio || log.data_criacao).toLocaleTimeString('pt-BR')}
                  </span>
                </div>
              ))}
              {logs.length === 0 && (
                <div className="p-8 text-center text-slate-400 italic text-sm">Nenhum evento registrado hoje.</div>
              )}
            </tbody>
          </div>
        </section>
      </div>
    </div>
  )
}
