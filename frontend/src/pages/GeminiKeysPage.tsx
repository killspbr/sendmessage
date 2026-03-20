import { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '../api'

type GeminiKey = {
  id: number
  nome: string
  api_key?: string
  status: 'ativa' | 'limite_atingido' | 'erro' | 'pausada'
  requests_count: number
  ultimo_uso: string | null
  observacoes: string | null
}

type OperationalStats = {
  ai?: {
    activeKeys?: number
    requestsToday?: number
    poolRequestsToday?: number
    globalRequestsToday?: number
    userRequestsToday?: number
    environmentRequestsToday?: number
  }
}

const statusMap: Record<GeminiKey['status'], string> = {
  ativa: 'Ativa',
  limite_atingido: 'No limite',
  erro: 'Erro',
  pausada: 'Pausada',
}

export default function GeminiKeysPage() {
  const [keys, setKeys] = useState<GeminiKey[]>([])
  const [stats, setStats] = useState<OperationalStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newKey, setNewKey] = useState({ nome: '', api_key: '', observacoes: '' })

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [keysRes, statsRes] = await Promise.all([
        apiFetch('/api/admin/gemini-keys'),
        apiFetch('/api/admin/operational-stats'),
      ])
      setKeys(Array.isArray(keysRes?.data) ? keysRes.data : [])
      setStats(statsRes ?? null)
    } catch (e) {
      console.error('Erro ao carregar chaves Gemini:', e)
      setError('Não foi possível carregar os dados das chaves Gemini.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const capacity = useMemo(() => {
    const activeKeys = stats?.ai?.activeKeys || 0
    const requestsToday = stats?.ai?.requestsToday || 0
    const poolRequestsToday = stats?.ai?.poolRequestsToday || 0
    const max = activeKeys * 20
    return {
      activeKeys,
      requestsToday,
      poolRequestsToday,
      globalRequestsToday: stats?.ai?.globalRequestsToday || 0,
      userRequestsToday: stats?.ai?.userRequestsToday || 0,
      environmentRequestsToday: stats?.ai?.environmentRequestsToday || 0,
      max,
      remaining: Math.max(0, max - poolRequestsToday),
    }
  }, [stats])

  const handleAddKey = async () => {
    setError(null)
    try {
      await apiFetch('/api/admin/gemini-keys', {
        method: 'POST',
        body: JSON.stringify(newKey),
      })
      setShowAddModal(false)
      setNewKey({ nome: '', api_key: '', observacoes: '' })
      await loadData()
    } catch (e) {
      console.error('Erro ao adicionar chave Gemini:', e)
      setError('Não foi possível cadastrar a chave Gemini.')
    }
  }

  const handleDeleteKey = async (id: number) => {
    if (!window.confirm('Deseja excluir esta chave?')) return
    setError(null)
    try {
      await apiFetch(`/api/admin/gemini-keys/${id}`, { method: 'DELETE' })
      await loadData()
    } catch (e) {
      console.error('Erro ao excluir chave Gemini:', e)
      setError('Não foi possível excluir a chave.')
    }
  }

  const handleResetUsage = async () => {
    if (!window.confirm('Deseja resetar o contador de todas as chaves?')) return
    setError(null)
    try {
      await apiFetch('/api/admin/gemini-keys/reset', { method: 'POST' })
      await loadData()
    } catch (e) {
      console.error('Erro ao resetar uso Gemini:', e)
      setError('Não foi possível resetar os contadores.')
    }
  }

  return (
    <section className="flex flex-col gap-6">
      <div className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 p-6 text-white shadow-xl shadow-slate-300/40">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200/80">Gemini</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">Gerenciamento de APIs Gemini</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-300">
              Revise a rotação de chaves, consumo do dia e capacidade disponível para geração e reescrita de campanhas.
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => void handleResetUsage()} className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10">
              Resetar contadores
            </button>
            <button onClick={() => setShowAddModal(true)} className="rounded-2xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300">
              Nova chave
            </button>
          </div>
        </div>
      </div>

      {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">{error}</div>}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Uso do dia</div>
          <div className="mt-3 text-3xl font-semibold text-slate-900">{capacity.requestsToday}</div>
          <div className="mt-1 text-sm text-slate-500">requisições totais registradas</div>
          <div className="mt-2 text-xs text-slate-400">
            Pool: {capacity.poolRequestsToday} · Global: {capacity.globalRequestsToday} · Pessoal: {capacity.userRequestsToday}
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Chaves ativas</div>
          <div className="mt-3 text-3xl font-semibold text-slate-900">{capacity.activeKeys}</div>
          <div className="mt-1 text-sm text-slate-500">de {keys.length} cadastradas</div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Capacidade restante</div>
          <div className="mt-3 text-3xl font-semibold text-emerald-600">{capacity.remaining}</div>
          <div className="mt-1 text-sm text-slate-500">de {capacity.max || 0} possíveis hoje no pool administrado</div>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Pool de chaves</h2>
          <p className="text-sm text-slate-500">Confirme status, consumo e rotação das chaves usadas pelo sistema.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-3 font-semibold text-slate-500">Nome</th>
                <th className="px-5 py-3 font-semibold text-slate-500">Status</th>
                <th className="px-5 py-3 font-semibold text-slate-500">Uso</th>
                <th className="px-5 py-3 font-semibold text-slate-500">Último uso</th>
                <th className="px-5 py-3 font-semibold text-slate-500">Observações</th>
                <th className="px-5 py-3 text-right font-semibold text-slate-500">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-slate-400">Carregando chaves...</td></tr>
              ) : keys.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-slate-400">Nenhuma chave cadastrada.</td></tr>
              ) : (
                keys.map((key) => (
                  <tr key={key.id} className="border-t border-slate-100">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-900">{key.nome}</div>
                      <div className="font-mono text-xs text-slate-400">
                        {key.api_key ? `${key.api_key.slice(0, 6)}...${key.api_key.slice(-4)}` : 'Chave mascarada pelo backend'}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${key.status === 'ativa' ? 'bg-emerald-50 text-emerald-700' : key.status === 'limite_atingido' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>
                        {statusMap[key.status]}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-700">{key.requests_count}/20</td>
                    <td className="px-5 py-4 text-slate-500">{key.ultimo_uso ? new Date(key.ultimo_uso).toLocaleString('pt-BR') : 'Nunca usada'}</td>
                    <td className="px-5 py-4 text-slate-500">{key.observacoes || 'Sem observações'}</td>
                    <td className="px-5 py-4 text-right">
                      <button onClick={() => void handleDeleteKey(key.id)} className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100">
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-lg rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-semibold text-slate-900">Nova chave Gemini</h2>
            <p className="mt-1 text-sm text-slate-500">Cadastre uma nova chave para ampliar o pool de rotação.</p>
            <div className="mt-5 grid gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600">Nome amigável</label>
                <input type="text" value={newKey.nome} onChange={(e) => setNewKey((prev) => ({ ...prev, nome: e.target.value }))} className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none transition focus:border-cyan-500 focus:bg-white" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600">API Key</label>
                <input type="password" value={newKey.api_key} onChange={(e) => setNewKey((prev) => ({ ...prev, api_key: e.target.value }))} className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none transition focus:border-cyan-500 focus:bg-white" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600">Observações</label>
                <textarea value={newKey.observacoes} onChange={(e) => setNewKey((prev) => ({ ...prev, observacoes: e.target.value }))} rows={4} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-cyan-500 focus:bg-white" />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowAddModal(false)} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">Cancelar</button>
              <button onClick={() => void handleAddKey()} disabled={!newKey.nome.trim() || !newKey.api_key.trim()} className="rounded-2xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60">Cadastrar</button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
