import { useState, useEffect } from 'react'

type GeminiKey = {
  id: number
  name: string
  api_key: string
  status: 'ativa' | 'limite_atingido' | 'erro' | 'pausada'
  usage_count: number
  last_used_at: string | null
  observations: string | null
}

export default function GeminiKeysPage() {
  const [keys, setKeys] = useState<GeminiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newKey, setNewKey] = useState({ name: '', api_key: '', observations: '' })
  const [stats, setStats] = useState<any>(null)

  const fetchKeys = async () => {
    try {
      const token = localStorage.getItem('token')
      const baseUrl = (import.meta as any).env.VITE_API_URL || 'https://sendmessage-backend.up.railway.app'
      
      const [keysRes, statsRes] = await Promise.all([
        fetch(`${baseUrl}/api/admin/gemini-keys`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${baseUrl}/api/admin/operational-stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ])

      const keysData = await keysRes.json()
      const statsData = await statsRes.json()

      setKeys(keysData)
      setStats(statsData)
    } catch (error) {
      console.error('Erro ao buscar chaves:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchKeys()
  }, [])

  const handleAddKey = async () => {
    try {
      const token = localStorage.getItem('token')
      const baseUrl = (import.meta as any).env.VITE_API_URL || 'https://sendmessage-backend.up.railway.app'
      
      const res = await fetch(`${baseUrl}/api/admin/gemini-keys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newKey)
      })

      if (res.ok) {
        setShowAddModal(false)
        setNewKey({ name: '', api_key: '', observations: '' })
        fetchKeys()
      }
    } catch (error) {
      console.error('Erro ao adicionar chave:', error)
    }
  }

  const handleDeleteKey = async (id: number) => {
    if (!confirm('Deseja excluir esta chave?')) return
    try {
      const token = localStorage.getItem('token')
      const baseUrl = (import.meta as any).env.VITE_API_URL || 'https://sendmessage-backend.up.railway.app'
      
      await fetch(`${baseUrl}/api/admin/gemini-keys/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      fetchKeys()
    } catch (error) {
      console.error('Erro ao excluir chave:', error)
    }
  }

  const handleResetUsage = async () => {
    if (!confirm('Deseja resetar o contador de todas as chaves?')) return
    try {
      const token = localStorage.getItem('token')
      const baseUrl = (import.meta as any).env.VITE_API_URL || 'https://sendmessage-backend.up.railway.app'
      
      await fetch(`${baseUrl}/api/admin/gemini-keys/reset`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      fetchKeys()
    } catch (error) {
      console.error('Erro ao resetar uso:', error)
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <span className="text-emerald-600">🤖</span> Gerenciamento de APIs Gemini
          </h1>
          <p className="text-sm text-slate-500">
            Adicione múltiplas chaves para evitar bloqueios e garantir o funcionamento da IA. O sistema rotaciona chaves automaticamente com limite de 20 requisições/chave.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleResetUsage}
            className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
          >
            Resetar Contadores
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition"
          >
            + Nova Chave
          </button>
        </div>
      </header>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm flex flex-col gap-1">
            <span className="text-xs text-slate-400 uppercase font-semibold">Uso Total Hoje</span>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold text-slate-800">{stats.ai?.requestsToday || 0}</span>
              <span className="text-xs text-slate-400 mb-1">chamadas</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
              <div 
                className="h-full bg-emerald-500 transition-all duration-500" 
                style={{ width: `${Math.min(100, (stats.ai?.requestsToday / (stats.ai?.activeKeys * 20 || 1)) * 100)}%` }}
              />
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm flex flex-col gap-1">
            <span className="text-xs text-slate-400 uppercase font-semibold">Chaves Disponíveis</span>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold text-slate-800">{stats.ai?.activeKeys || 0}</span>
              <span className="text-xs text-slate-400 mb-1">de {keys.length} total</span>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm flex flex-col gap-1">
            <span className="text-xs text-slate-400 uppercase font-semibold">Capacidade Restante</span>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold text-emerald-600">
                {Math.max(0, (stats.ai?.activeKeys * 20) - stats.ai?.requestsToday)}
              </span>
              <span className="text-xs text-slate-400 mb-1">requisições livres</span>
            </div>
          </div>
        </div>
      )}

      {/* Keys Table/Grid */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Nome/Identificador</th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Uso (20 máx)</th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Último Uso</th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">Carregando chaves...</td></tr>
            ) : keys.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">Nenhuma chave cadastrada.</td></tr>
            ) : keys.map(key => (
              <tr key={key.id} className="hover:bg-slate-50/50 transition">
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-800">{key.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {key.api_key.slice(0, 4)}...{key.api_key.slice(-4)}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    key.status === 'ativa' ? 'bg-emerald-100 text-emerald-700' :
                    key.status === 'limite_atingido' ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {key.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4">
                   <div className="flex items-center gap-2">
                     <span className="text-sm font-medium text-slate-700">{key.usage_count}</span>
                     <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                       <div 
                         className={`h-full transition-all ${key.usage_count >= 18 ? 'bg-red-500' : 'bg-emerald-500'}`}
                         style={{ width: `${(key.usage_count / 20) * 100}%` }}
                       />
                     </div>
                   </div>
                </td>
                <td className="px-6 py-4 text-xs text-slate-500">
                  {key.last_used_at ? new Date(key.last_used_at).toLocaleString() : 'Nunca usada'}
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => handleDeleteKey(key.id)}
                    className="text-slate-400 hover:text-red-500 transition"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 space-y-4">
              <h3 className="text-xl font-bold text-slate-900">Nova Chave Gemini</h3>
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Identificador Amigável</label>
                  <input
                    type="text"
                    placeholder="Ex: Chave do Pedro 01"
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition"
                    value={newKey.name}
                    onChange={e => setNewKey({ ...newKey, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase">API Key (Google AI Studio)</label>
                  <input
                    type="password"
                    placeholder="AIzaSy..."
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition"
                    value={newKey.api_key}
                    onChange={e => setNewKey({ ...newKey, api_key: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Observações</label>
                  <textarea
                    placeholder="Algum lembrete sobre esta chave"
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition h-20 resize-none"
                    value={newKey.observations}
                    onChange={e => setNewKey({ ...newKey, observations: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddKey}
                  disabled={!newKey.name || !newKey.api_key}
                  className="flex-1 py-3 rounded-2xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 disabled:opacity-50 shadow-lg shadow-emerald-200 transition"
                >
                  Cadastrar Chave
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
