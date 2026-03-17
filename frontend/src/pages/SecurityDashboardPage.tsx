import { useState, useEffect } from 'react'

export default function SecurityDashboardPage() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token')
      const baseUrl = (import.meta as any).env.VITE_API_URL || 'https://sendmessage-backend.up.railway.app'
      const res = await fetch(`${baseUrl}/api/admin/operational-stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      setStats(data)
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 30000) // Atualiza a cada 30s
    return () => clearInterval(interval)
  }, [])

  if (loading && !stats) return <div className="p-8 text-center text-slate-500">Carregando painel de segurança...</div>

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <span className="text-emerald-600">🛡️</span> Segurança e Saúde da Conta
          </h1>
          <p className="text-sm text-slate-500">
            Monitore o comportamento de envio e reduza os riscos de bloqueio da sua conta WhatsApp.
          </p>
        </div>
        <button 
          onClick={fetchStats}
          className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 transition"
          title="Atualizar agora"
        >
          🔄
        </button>
      </header>

      {/* Grid de Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Envios Hoje</span>
          <div className="text-3xl font-black text-slate-800 mt-1">{stats?.messages?.sentToday || 0}</div>
          <div className="text-[10px] text-emerald-500 font-semibold mt-1 flex items-center gap-1">
            <span>●</span> Operação Normal
          </div>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Última Hora</span>
          <div className="text-3xl font-black text-slate-800 mt-1">{stats?.messages?.sentLastHour || 0}</div>
          <div className="text-[10px] text-slate-400 mt-1">Velocidade: {stats?.messages?.sentLastHour || 0} msg/h</div>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Fila Pendente</span>
          <div className="text-3xl font-black text-amber-500 mt-1">{stats?.messages?.pendingQueue || 0}</div>
          <div className="text-[10px] text-slate-400 mt-1">Aguardando scheduler</div>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Falhas/Erros</span>
          <div className="text-3xl font-black text-red-500 mt-1">{stats?.messages?.failedCount || 0}</div>
          <div className="text-[10px] text-slate-400 mt-1">Total acumulado</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Anti-Bloqueio Status */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900 rounded-3xl p-6 text-white overflow-hidden relative border border-slate-800 shadow-2xl">
            <div className="relative z-10 flex flex-col md:flex-row gap-6">
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <h2 className="text-lg font-bold">Motor de Envio Ativo</h2>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
                    <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">Intervalo Aleatório</div>
                    <div className="text-lg font-bold">30s - 90s</div>
                  </div>
                  <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
                    <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">Pausa Lote</div>
                    <div className="text-lg font-bold">10 min</div>
                  </div>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed italic">
                  "O sistema está emulando comportamento humano, variando o tempo entre cada entrega e respeitando janelas de descanso da conta."
                </p>
              </div>
              <div className="w-full md:w-48 h-48 bg-emerald-500/10 rounded-full border border-emerald-500/20 flex flex-col items-center justify-center gap-1 shadow-[0_0_50px_rgba(16,185,129,0.1)]">
                 <span className="text-[10px] font-bold text-emerald-400 uppercase">Score de Risco</span>
                 <span className="text-5xl font-black text-emerald-400">Baixo</span>
                 <span className="text-[9px] text-emerald-400/60 font-mono">CODE: WH-SEC-OK</span>
              </div>
            </div>
            {/* Background decoration */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">Alertas Operacionais</h3>
              <span className="text-[10px] font-mono text-slate-400">LOG-ENGINE V1.0</span>
            </div>
            <div className="p-6">
               <ul className="space-y-4">
                 {stats?.logs?.length > 0 ? stats.logs.map((log: any, idx: number) => (
                   <li key={idx} className="flex gap-3 text-sm">
                     <span className="text-slate-400 font-mono shrink-0">{new Date(log.data_evento).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                     <div className="flex flex-col">
                       <span className="font-semibold text-slate-700">{log.event}</span>
                       <span className="text-xs text-slate-500">{log.details}</span>
                     </div>
                   </li>
                 )) : (
                   <li className="text-center py-4 text-slate-400 text-xs italic">Nenhum evento crítico registrado nas últimas 24 horas.</li>
                 )}
               </ul>
            </div>
          </div>
        </div>

        {/* Gemini Capacity */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-6">
           <h3 className="font-bold text-slate-800">Cota de Inteligência Artificial</h3>
           
           <div className="space-y-4">
             <div className="flex flex-col gap-2">
               <div className="flex justify-between items-end">
                 <span className="text-xs font-semibold text-slate-500">CONSUMO GERAL</span>
                 <span className="text-sm font-bold text-slate-800">
                    {Math.round((stats?.ai?.requestsToday / (stats?.ai?.activeKeys * 20 || 1)) * 100)}%
                 </span>
               </div>
               <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                 <div 
                   className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.3)] transition-all duration-1000"
                   style={{ width: `${Math.min(100, (stats?.ai?.requestsToday / (stats?.ai?.activeKeys * 20 || 1)) * 100)}%` }}
                 />
               </div>
             </div>

             <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Chaves Ativas</span>
                  <span className="text-xl font-bold text-slate-800">{stats?.ai?.activeKeys || 0}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Cota Restante</span>
                  <span className="text-xl font-bold text-slate-800">
                    {Math.max(0, (stats?.ai?.activeKeys * 20) - stats?.ai?.requestsToday)}
                  </span>
                </div>
             </div>

             <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex gap-3 items-start">
               <span className="text-lg">💡</span>
               <p className="text-[11px] text-emerald-800 leading-relaxed">
                 <b>Dica:</b> Para campanhas volumosas (mais de 1.000 mensagens com IA), recomenda-se ter pelo menos 50 chaves Gemini ativas para garantir rotação fluida sem interrupções.
               </p>
             </div>
           </div>

           <div className="pt-4 border-t border-slate-50">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Integridade de Envio</h4>
              <div className="space-y-3">
                 <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">Scheduler Engine</span>
                    <span className="text-emerald-500 font-bold">ONLINE</span>
                 </div>
                 <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">Message Queue</span>
                    <span className="text-emerald-500 font-bold">HEALTHY</span>
                 </div>
                 <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">Evolution API</span>
                    <span className="text-emerald-500 font-bold">CONECTADO</span>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  )
}
