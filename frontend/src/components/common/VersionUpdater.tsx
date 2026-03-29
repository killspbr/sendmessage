import { useState, useEffect } from 'react'
import { apiFetch } from '../../api'

interface VersionInfo {
  commit: string
  timestamp: string
  message: string
}

export function VersionUpdater() {
  const [currentLocal, setCurrentLocal] = useState<VersionInfo | null>(null)
  const [remote, setRemote] = useState<VersionInfo | null>(null)
  const [showToast, setShowToast] = useState(false)
  const [checking, setChecking] = useState(false)

  const checkVersion = async () => {
    if (checking) return
    setChecking(true)
    try {
      const data = await apiFetch('/api/version').catch(() => null)
      if (!data?.commit) return

      if (!currentLocal) {
        setCurrentLocal(data)
        return
      }

      if (data.commit !== currentLocal.commit) {
        setRemote(data)
        setShowToast(true)
      }
    } catch (err) {
      console.warn('[VersionUpdater] falha ao checar versao:', err)
    } finally {
      setChecking(false)
    }
  }

  useEffect(() => {
    checkVersion()
    const timer = setInterval(checkVersion, 300000)
    return () => clearInterval(timer)
  }, [currentLocal?.commit])

  const handleUpdate = () => {
    window.location.reload()
  }

  if (!showToast || !remote) return null

  return (
    <div className="fixed bottom-6 right-6 z-[9999] animate-in slide-in-from-right-10 duration-300">
      <div className="bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900 shadow-2xl rounded-2xl p-4 w-80 text-sm overflow-hidden group">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-950 rounded-lg shrink-0">
            <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400 animate-spin-slow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                Nova versão!
                <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
              </h4>
              <button 
                onClick={() => setShowToast(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-2 mt-2">
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed truncate-2-lines">
                {remote.message || 'Novas melhorias e correções aplicadas.'}
              </p>
              
              <div className="flex flex-col gap-1 text-[11px] font-mono p-2 bg-slate-50 dark:bg-slate-950 rounded-lg">
                <div className="flex justify-between items-center text-slate-500 dark:text-slate-500">
                  <span>Commit:</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold">{remote.commit}</span>
                </div>
                <div className="flex justify-between items-center text-slate-500 dark:text-slate-500">
                  <span>Alterado em:</span>
                  <span>{new Date(remote.timestamp).toLocaleString('pt-BR')}</span>
                </div>
              </div>

              <button
                onClick={handleUpdate}
                className="w-full mt-3 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-indigo-200 dark:shadow-none"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Atualizar Agora
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <style>{`
        .animate-spin-slow {
          animation: spin 3s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .truncate-2-lines {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  )
}
