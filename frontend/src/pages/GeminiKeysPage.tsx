import { useState, useEffect } from 'react'
import { apiFetch } from '../api'

type GeminiKey = {
  id: number
  nome: string
  api_key: string
  status: 'ativa' | 'limite_atingido' | 'erro' | 'pausada'
  requests_count: number
  ultimo_uso: string | null
  observacoes: string | null
}

export default function GeminiKeysPage() {
  const [keys, setKeys] = useState<GeminiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newKey, setNewKey] = useState({ nome: '', api_key: '', observacoes: '' })
  const [stats, setStats] = useState<any>(null)

  const loadData = async () => {
    try {
      const [keysRes, statsRes] = await Promise.all([
        apiFetch('/api/admin/gemini-keys'),
        apiFetch('/api/admin/operational-stats')
      ])
      
      setKeys(Array.isArray(keysRes.data) ? keysRes.data : [])
      setStats(statsRes.data || null)
    } catch (error) {
      console.error('Erro ao buscar chaves:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleAddKey = async () => {
    try {
      const res = await apiFetch('/api/admin/gemini-keys', {
        method: 'POST',
        body: JSON.stringify(newKey)
      })

      if (res.success) {
        setShowAddModal(false)
        setNewKey({ nome: '', api_key: '', observacoes: '' })
        loadData()
      }
    } catch (error) {
      console.error('Erro ao adicionar chave:', error)
      alert('Erro ao cadastrar chave. Verifique os dados.')
    }
  }

  const handleDeleteKey = async (id: number) => {
    if (!confirm('Deseja excluir esta chave?')) return
    try {
      await apiFetch(`/api/admin/gemini-keys/${id}`, { method: 'DELETE' })
      loadData()
    } catch (error) {
      console.error('Erro ao excluir chave:', error)
    }
  }

  const handleResetUsage = async () => {
    if (!confirm('Deseja resetar o contador de todas as chaves?')) return
    try {
      await apiFetch('/api/admin/gemini-keys/reset', { method: 'POST' })
      loadData()
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
            O sistema rotaciona chaves automaticamente (limite de 20 requisições/chave).
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
            <span className="text-xs text-slate-400 uppercase font-semibold">Uso Total</span>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold text-slate-800">{stats.ai?.requestsToday || 0}</span>
              <span className="text-xs text-slate-400 mb-1">chamadas</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
              <div 
                className="h-full bg-emerald-500 transition-all duration-500" 
                style={{ width: `${Math.min(100, (stats.ai?.requestsToday / ((stats.ai?.activeKeys || 1) * 20)) * 100)}%` }}
              />
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm flex flex-col gap-1">
            <span className="text-xs text-slate-400 uppercase font-semibold">Chaves Ativas</span>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold text-slate-800">{stats.ai?.activeKeys || 0}</span>
              <span className="text-xs text-slate-400 mb-1">de {keys.length} total</span>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm flex flex-col gap-1">
            <span className="text-xs text-slate-400 uppercase font-semibold">Capacidade Livre</span>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold text-emerald-600">
                {Math.max(0, ((stats.ai?.activeKeys || 0) * 20) - (stats.ai?.requestsToday || 0))}
              </span>
              <span className="text-xs text-slate-400 mb-1">requisições restantes</span>
            </div>
          </div>
        </div>
      )}

      {/* Keys Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden text-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 font-bold text-slate-500 uppercase text-[10px]">Nome</th>
              <th className="px-6 py-4 font-bold text-slate-500 uppercase text-[10px]">Status</th>
              <th className="px-6 py-4 font-bold text-slate-500 uppercase text-[10px]">Uso (20 máx)</th>
              <th className="px-6 py-4 font-bold text-slate-500 uppercase text-[10px]">Último Uso</th>
              <th className="px-6 py-4 font-bold text-slate-500 uppercase text-[10px] text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">Carregando chaves...</td></tr>
            ) : keys.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">Nenhuma chave cadastrada.</td></tr>
            ) : keys.map(key => (
              <tr key={key.id} className="hover:bg-slate-50 transition">
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-800">{key.nome}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {key.api_key?.slice(0, 6)}...{key.api_key?.slice(-4)}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    key.status === 'ativa' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                    key.status === 'limite_atingido' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                    'bg-red-50 text-red-700 border border-red-100'
                  }`}>
                    {key.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs">
                   <div className="flex items-center gap-3">
                     <span className="font-bold text-slate-700">{key.requests_count}/20</span>
                     <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                       <div 
                         className={`h-full transition-all ${key.requests_count >= 18 ? 'bg-red-500' : 'bg-emerald-500'}`}
                         style={{ width: `${(key.requests_count / 20) * 100}%` }}
                       />
                     </div>
                   </div>
                </td>
                <td className="px-6 py-4 text-xs text-slate-400">
                  {key.ultimo_uso ? new Date(key.ultimo_uso).toLocaleString('pt-BR') : 'Nunca usada'}
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => handleDeleteKey(key.id)}
                    className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                    title="Excluir Chave"
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
            <div className="p-8 space-y-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Nova Chave Gemini</h3>
                <p className="text-sm text-slate-500">Adicione uma chave do Google AI Studio.</p>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Identificador Amigável</label>
                  <input
                    type="text"
                    placeholder="Ex: Chave Secundária 01"
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition"
                    value={newKey.nome}
                    onChange={e => setNewKey({ ...newKey, nome: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">API Key</label>
                  <input
                    type="password"
                    placeholder="AIzaSy..."
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition"
                    value={newKey.api_key}
                    onChange={e => setNewKey({ ...newKey, api_key: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-4 rounded-2xl border border-slate-100 text-sm font-bold text-slate-500 hover:bg-slate-50 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddKey}
                  disabled={!newKey.nome || !newKey.api_key}
                  className="flex-1 py-4 rounded-2xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 disabled:opacity-50 shadow-lg shadow-emerald-200 transition"
                >
                  Cadastrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
