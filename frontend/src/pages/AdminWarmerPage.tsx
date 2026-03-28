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
  business_hours_end: string
  sent_today?: number
}

export function AdminWarmerPage({ can }: { can?: (code: string) => boolean }) {
  const [warmers, setWarmers] = useState<WarmerConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Formulário
  const [isCreating, setIsCreating] = useState(false)
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
  }, [])

  const loadWarmers = async () => {
    try {
      setLoading(true)
      const data = await apiFetch('/api/admin/warmer')
      setWarmers(data || [])
    } catch (e: any) {
      setError(e.message || 'Erro ao carregar dados do maturador')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    try {
      if (!form.instance_a_id || !form.instance_b_id || !form.phone_a || !form.phone_b) {
        alert('Preencha os nomes das instâncias e os telefones com DDI.')
        return
      }
      await apiFetch('/api/admin/warmer', {
        method: 'POST',
        body: JSON.stringify(form)
      })
      setIsCreating(false)
      loadWarmers()
    } catch (e: any) {
      alert(e.message || 'Erro ao criar rotina de maturação')
    }
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
             <button onClick={() => setIsCreating(!isCreating)} className="rounded-2xl border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold transition hover:bg-white/20">
              {isCreating ? 'Cancelar' : 'Nova Maturação +'}
            </button>
          </div>
        </div>
      </div>

      {isCreating && (
        <div className="rounded-3xl border border-indigo-200 bg-indigo-50/50 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            ⚙️ Configurar Interação
          </h2>
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
            <button onClick={handleCreate} className="rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700">
              Iniciar Maturação
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="p-10 text-center text-slate-500 text-sm animate-pulse">Carregando maturadores...</div>
      ) : warmers.length === 0 && !isCreating ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-slate-500 text-sm">
          Nenhuma rotina de maturação ativa. Crie uma para começar o aquecimento dos chips.
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
                      <div className={`p-2 rounded-full ${isPaused ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                        {isPaused ? <span className="text-xs">⏹️</span> : <span className="text-xs">▶️</span>}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800 text-sm tracking-tight flex items-center gap-1">
                          {warmer.instance_a_id} <span className="text-[10px] text-slate-400">↔️</span> {warmer.instance_b_id}
                        </h3>
                        <p className="text-[11px] text-slate-500 uppercase tracking-wide">Dia {diffDays + 1} de maturação</p>
                      </div>
                    </div>
                    
                    <button onClick={() => handleToggleStatus(warmer.id, warmer.status)} className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${isPaused ? 'border-amber-300 text-amber-700 hover:bg-amber-100' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                      {isPaused ? 'Retomar' : 'Pausar'}
                    </button>
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
                      Ativo dás {warmer.business_hours_start.substring(0,5)}h às {warmer.business_hours_end.substring(0,5)}h. Incremento: {warmer.increment_per_day} msgs/dia.
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
