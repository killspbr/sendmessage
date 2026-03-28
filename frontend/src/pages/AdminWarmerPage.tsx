import { useEffect, useState } from 'react'
import { apiFetch } from '../api'

type WarmerConfig = {
  id: string
  instance_a_id: string
  instance_b_id: string
  phone_a: string
  phone_b: string
  status: 'active' | 'paused' | 'error'
  base_daily_limit: number
  increment_per_day: number
  start_date: string
  business_hours_start: string
  business_hours_end?: string
  sent_today?: number
  current_mode?: 'active' | 'sleeping' | 'afk'
  mode_until?: string
}

export function AdminWarmerPage({ can }: { can?: (code: string) => boolean }) {
  const [warmers, setWarmers] = useState<WarmerConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Dashboard states
  const [logsModalId, setLogsModalId] = useState<string | null>(null)
  const [logs, setLogs] = useState<any[]>([])
  const [loadingLogs, setLoadingLogs] = useState(false)
  const [forcingId, setForcingId] = useState<string | null>(null)

  // Formulário
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    instance_a_id: '',
    phone_a: '',
    instance_b_id: '',
    phone_b: '',
    base_daily_limit: 10,
    increment_per_day: 10,
    business_hours_start: '08:00',
    business_hours_end: '20:00'
  })

  useEffect(() => {
    loadWarmers()
    const polling = setInterval(() => {
      loadWarmers(true)
    }, 10000)
    return () => clearInterval(polling)
  }, [])

  const loadWarmers = async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      const data = await apiFetch('/api/admin/warmer')
      setWarmers(Array.isArray(data) ? data : [])
    } catch (e: any) {
      if (!silent) setError(e.message || 'Erro ao carregar dados do maturador')
    } finally {
      if (!silent) setLoading(false)
    }
  }

  const handleForceRun = async (id: string) => {
    try {
      setForcingId(id)
      const res = await apiFetch(`/api/admin/warmer/${id}/force`, { method: 'POST' })
      if (res?.success === false) {
        alert('⚠️ Aviso: ' + (res.message || res.error || 'Erro na instância'))
      } else {
        alert('Disparo evocado com sucesso! A mensagem foi testada.')
      }
      loadWarmers(true)
    } catch (e: any) {
      alert('Erro ao forçar disparo: ' + e.message)
    } finally {
      setForcingId(null)
    }
  }

  const openLogs = async (id: string) => {
    setLogsModalId(id)
    setLoadingLogs(true)
    setLogs([])
    try {
      const data = await apiFetch(`/api/admin/warmer/${id}/logs`)
      setLogs(Array.isArray(data) ? data : [])
    } catch (e: any) {
      alert('Erro ao carregar logs: ' + e.message)
    } finally {
      setLoadingLogs(false)
    }
  }

  const handleSave = async () => {
    try {
      if (!form.instance_a_id || !form.instance_b_id || !form.phone_a || !form.phone_b) {
        alert('Preencha os nomes das instâncias e os telefones com DDI.')
        return
      }

      const method = editingId ? 'PUT' : 'POST'
      const url = editingId ? `/api/admin/warmer/${editingId}` : '/api/admin/warmer'

      await apiFetch(url, {
        method,
        body: JSON.stringify(form)
      })
      
      setIsCreating(false)
      setEditingId(null)
      loadWarmers()
      setForm({
        instance_a_id: '',
        phone_a: '',
        instance_b_id: '',
        phone_b: '',
        base_daily_limit: 10,
        increment_per_day: 10,
        business_hours_start: '08:00',
        business_hours_end: '20:00'
      })
    } catch (e: any) {
      alert(e.message || 'Erro ao salvar maturação')
    }
  }

  const startEdit = (warmer: WarmerConfig) => {
     setForm({
        instance_a_id: warmer.instance_a_id,
        phone_a: warmer.phone_a,
        instance_b_id: warmer.instance_b_id,
        phone_b: warmer.phone_b,
        base_daily_limit: warmer.base_daily_limit,
        increment_per_day: warmer.increment_per_day,
        business_hours_start: warmer.business_hours_start?.substring(0,5) || '08:00',
        business_hours_end: warmer.business_hours_end?.substring(0,5) || '20:00'
     })
     setEditingId(warmer.id)
     setIsCreating(true)
     window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active'
    try {
      await apiFetch(`/api/admin/warmer/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      })
      loadWarmers()
    } catch (e: any) {
      alert('Erro ao alterar status: ' + e.message)
    }
  }

  if (can && !can('admin.users')) {
    return <section className="p-5"><p>Acesso negado.</p></section>
  }

  return (
    <section className="flex flex-col gap-6 max-w-5xl mx-auto w-full">
      <div className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 p-6 text-white shadow-xl shadow-slate-300/40">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-indigo-300/80 flex items-center gap-2">
              <span className="text-[10px]">🧬</span> Laboratório
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">Maturador de Chips</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-300">
              Configure instâncias para conversarem entre si de forma autônoma e humanizada, aumentando gradualmente a reputação para evitar banimentos em disparos em massa.
            </p>
          </div>
          <div>
             <button onClick={() => { 
                if (isCreating) {
                  setIsCreating(false);
                  setEditingId(null);
                  setForm({
                    instance_a_id: '',
                    phone_a: '',
                    instance_b_id: '',
                    phone_b: '',
                    base_daily_limit: 10,
                    increment_per_day: 10,
                    business_hours_start: '08:00',
                    business_hours_end: '20:00'
                  });
                } else {
                  setIsCreating(true);
                }
             }} className="rounded-2xl border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold transition hover:bg-white/20">
              {isCreating ? 'Cancelar' : 'Nova Maturação +'}
            </button>
          </div>
        </div>
      </div>

      {isCreating && (
        <div className="rounded-3xl border border-indigo-200 bg-indigo-50/50 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            {editingId ? '✏️ Editar Interação' : '⚙️ Configurar Interação'}
          </h2>
          {/* Form Omitido para não ficar muito longo visualmente se minimizado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="p-4 bg-white rounded-2xl border border-slate-200">
                <h3 className="font-medium text-slate-700 mb-3 border-b pb-2">Instância A</h3>
                <input type="text" placeholder="Nome exato da Instância A na Evolution" value={form.instance_a_id} onChange={e=>setForm({...form, instance_a_id: e.target.value})} className="w-full text-sm p-3 mb-2 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-indigo-500" />
                <input type="text" placeholder="Telefone do Chip A (ex: 551199999999)" value={form.phone_a} onChange={e=>setForm({...form, phone_a: e.target.value})} className="w-full text-sm p-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-indigo-500" />
              </div>
            </div>
            <div className="space-y-4">
               <div className="p-4 bg-white rounded-2xl border border-slate-200">
                <h3 className="font-medium text-slate-700 mb-3 border-b pb-2">Instância B</h3>
                <input type="text" placeholder="Nome exato da Instância B na Evolution" value={form.instance_b_id} onChange={e=>setForm({...form, instance_b_id: e.target.value})} className="w-full text-sm p-3 mb-2 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-indigo-500" />
                <input type="text" placeholder="Telefone do Chip B (ex: 551188888888)" value={form.phone_b} onChange={e=>setForm({...form, phone_b: e.target.value})} className="w-full text-sm p-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-indigo-500" />
              </div>
            </div>
            <div className="md:col-span-2 p-4 bg-white rounded-2xl border border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-600">Mensagens Dia 1</label>
                <input type="number" value={form.base_daily_limit} onChange={e=>setForm({...form, base_daily_limit: Number(e.target.value)})} className="mt-1 w-full text-sm p-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Incremento/Dia</label>
                <input type="number" value={form.increment_per_day} onChange={e=>setForm({...form, increment_per_day: Number(e.target.value)})} className="mt-1 w-full text-sm p-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Início Expediente</label>
                <input type="time" value={form.business_hours_start} onChange={e=>setForm({...form, business_hours_start: e.target.value})} className="mt-1 w-full text-sm p-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Fim Expediente</label>
                <input type="time" value={form.business_hours_end} onChange={e=>setForm({...form, business_hours_end: e.target.value})} className="mt-1 w-full text-sm p-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-indigo-500" />
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button onClick={handleSave} className="rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700">
              {editingId ? 'Salvar Alterações' : 'Iniciar Maturação'}
            </button>
          </div>
        </div>
      )}

      {/* Modal de Logs */}
      {logsModalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-xl bg-slate-50 border border-slate-200 rounded-3xl shadow-xl flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-white rounded-t-3xl">
              <h2 className="font-semibold text-slate-800 flex items-center gap-2">💬 Histórico de Interação</h2>
              <button onClick={() => setLogsModalId(null)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#efeae2]">
              {loadingLogs ? (
                 <div className="text-center text-sm text-slate-500 p-10 animate-pulse">Carregando conversas...</div>
              ) : logs.length === 0 ? (
                 <div className="text-center text-sm text-slate-500 p-10 bg-white/50 rounded-xl">Nenhuma mensagem registrada.</div>
              ) : (
                [...logs].reverse().map(log => {
                  const warmer = warmers.find(w => w.id === logsModalId);
                  const isSentByA = warmer ? log.from_phone === warmer.phone_a : true; 
                  return (
                    <div key={log.id} className={`flex flex-col mb-4 ${isSentByA ? 'items-end' : 'items-start'}`}>
                       <span className={`text-[10px] text-slate-400 mb-0.5 font-medium ${isSentByA ? 'pr-1' : 'pl-1'}`}>{log.from_phone}</span>
                       <div className={`w-fit min-w-[120px] max-w-[85%] px-3 pt-2 pb-1.5 shadow-sm text-[15px] leading-relaxed text-slate-800 ${isSentByA ? 'bg-[#dcf8c6] rounded-t-xl rounded-bl-xl rounded-br-sm' : 'bg-white rounded-t-xl rounded-br-xl rounded-bl-sm border border-slate-100'}`}>
                          <span className="whitespace-pre-wrap font-sans">{log.content_summary}</span>
                          <div className={`text-[10px] text-right mt-1 flex justify-end items-center gap-1 ${isSentByA ? 'text-emerald-700/60' : 'text-slate-400'}`}>
                            <span>{new Date(log.sent_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            {isSentByA && <span className="text-blue-500 text-[12px] leading-none mb-[2px]">✓✓</span>}
                          </div>
                       </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-300 bg-red-50 p-6 text-red-600 mb-6 font-medium">
          ⚠️ Ocorreu um erro: {error}
        </div>
      )}

      {loading ? (
        <div className="p-10 text-center text-slate-500 text-sm animate-pulse">Carregando maturadores...</div>
      ) : warmers.length === 0 && !isCreating ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 flex flex-col items-center justify-center gap-4 text-center text-slate-500 text-sm">
          <p>Nenhuma rotina de maturação ativa. Crie o seu primeiro aquecimento de instâncias.</p>
          <button onClick={() => setIsCreating(true)} className="rounded-2xl bg-indigo-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700">Adicionar Instância +</button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {warmers.map(warmer => {
              const startDate = new Date(warmer.start_date);
              const diffDays = Math.floor(Math.abs(new Date().getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
              const currentLimit = warmer.base_daily_limit + (diffDays * warmer.increment_per_day);
              const isPaused = warmer.status === 'paused';
              const progressPct = Math.min((warmer.sent_today || 0) / currentLimit * 100, 100);

              return (
                <div key={warmer.id} className={`rounded-3xl border p-5 transition ${isPaused ? 'border-amber-200 bg-amber-50/30' : 'border-slate-200 bg-white shadow-sm'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-2 items-center">
                      <div className={`p-2 rounded-full ${
                        warmer.current_mode === 'sleeping' ? 'bg-indigo-900 text-indigo-200' :
                        warmer.current_mode === 'afk' ? 'bg-orange-100 text-orange-600' :
                        isPaused ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
                      }`}>
                        {warmer.current_mode === 'sleeping' ? <span className="text-xs">🌙</span> :
                         warmer.current_mode === 'afk' ? <span className="text-xs">☕</span> :
                         isPaused ? <span className="text-xs">⏹️</span> : <span className="text-xs">▶️</span>}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800 text-sm tracking-tight flex items-center gap-1">
                          {warmer.instance_a_id} <span className="text-[10px] text-slate-400">↔️</span> {warmer.instance_b_id}
                        </h3>
                        <p className="text-[11px] text-slate-500 uppercase tracking-wide">
                          {warmer.current_mode === 'sleeping' ? `Dormindo até ${warmer.mode_until ? new Date(warmer.mode_until).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}` :
                           warmer.current_mode === 'afk' ? `Pausa p/ Café até ${warmer.mode_until ? new Date(warmer.mode_until).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}` :
                           isPaused ? 'Pausado' : `Dia ${diffDays + 1} de maturação`}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(warmer)} title="Editar Configuração" className="text-xs font-semibold px-3 py-1.5 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 transition">
                        ✏️
                      </button>
                      <button onClick={() => openLogs(warmer.id)} title="Ver conversas" className="text-xs font-semibold px-3 py-1.5 rounded-full border border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition">
                        💬
                      </button>
                      <button onClick={() => handleForceRun(warmer.id)} disabled={forcingId === warmer.id} title="Forçar Disparo Agora" className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition ${forcingId === warmer.id ? 'border-slate-300 text-slate-400 bg-slate-100 cursor-not-allowed' : 'border-amber-300 text-amber-600 hover:bg-amber-50'} flex items-center gap-1`}>
                        {forcingId === warmer.id ? <span className="animate-spin text-[10px]">⏳</span> : '⚡'}
                      </button>
                      <button onClick={() => handleToggleStatus(warmer.id, warmer.status)} className={`text-xs font-semibold px-4 py-1.5 rounded-full border ${isPaused ? 'border-amber-300 text-amber-700 hover:bg-amber-100' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                        {isPaused ? 'Retomar' : 'Pausar'}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between text-xs text-slate-500 border-b border-slate-100 pb-3">
                      <div><span className="font-medium text-slate-700">{warmer.phone_a}</span></div>
                      <span>💬</span>
                      <div><span className="font-medium text-slate-700">{warmer.phone_b}</span></div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="font-medium text-slate-600">Progresso Diário</span>
                        <span className="text-slate-500">{warmer.sent_today || 0} / {currentLimit} envios</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div className={`h-1.5 rounded-full ${progressPct >= 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`} style={{ width: `${progressPct}%` }}></div>
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-3 text-[11px] text-slate-500 flex items-center gap-2">
                      <span className="text-indigo-400">ℹ️</span>
                      Ativo dás {warmer.business_hours_start?.substring(0,5) || '08:00'}h às {warmer.business_hours_end?.substring(0,5) || '20:00'}h. Incremento: {warmer.increment_per_day} msgs/dia.
                    </div>
                  </div>
                </div>
              )
          })}
        </div>
      )}
    </section>
  )
}
