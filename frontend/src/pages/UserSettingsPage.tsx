import { useEffect, useState } from 'react'

type UserSettingsPageProps = {
  userSettings: {
    use_global_ai: boolean
    ai_api_key: string | null
  } | null
  onSaveOverrides: (overrides: {
    aiApiKey: string | null
  }) => Promise<void> | void
}

export function UserSettingsPage({ userSettings, onSaveOverrides }: UserSettingsPageProps) {
  const useGlobalAi = userSettings?.use_global_ai ?? true

  const [aiKey, setAiKey] = useState(userSettings?.ai_api_key ?? '')
  const [saving, setSaving] = useState(false)

  const [localUseGlobalAi, setLocalUseGlobalAi] = useState(useGlobalAi)

  useEffect(() => {
    setAiKey(userSettings?.ai_api_key ?? '')
  }, [userSettings?.ai_api_key])

  useEffect(() => {
    setLocalUseGlobalAi(useGlobalAi)
  }, [useGlobalAi])

  const handleSave = async () => {
    if (saving) return
    setSaving(true)
    try {
      await onSaveOverrides({
        aiApiKey: localUseGlobalAi ? null : aiKey.trim() || null,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-md p-4 md:p-5 flex flex-col gap-4 max-w-xl">
      <div>
        <h2 className="text-sm font-semibold text-slate-800">Minhas configurações</h2>
        <p className="text-[11px] text-slate-500">
          Configure sua API de IA pessoal. Os webhooks são gerenciados pelo administrador.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <div>
          <h3 className="text-xs font-semibold text-slate-800">Integração com IA</h3>
          <div className="mt-1 flex flex-col gap-1.5">
            <p className="text-[11px] text-slate-500">
              {localUseGlobalAi
                ? 'Sua conta está usando a API de IA global do sistema, baseada no plano gratuito do Google Gemini (limite aproximado de 20 requisições por dia, compartilhadas entre todos os clientes). Para volume maior ou resultados mais robustos, recomendamos contratar sua própria API do Gemini e informá-la abaixo.'
                : 'Você está usando uma API de IA própria desta conta. Se preferir, pode voltar a usar a API global gratuita (com limite diário reduzido e compartilhado) gerenciada pelo administrador.'}
            </p>
            <div>
              <button
                type="button"
                className="px-2 py-1 rounded-md border border-slate-200 bg-slate-50 text-[10px] font-medium text-slate-700 hover:bg-slate-100"
                onClick={() => setLocalUseGlobalAi((prev) => !prev)}
              >
                {localUseGlobalAi ? 'Usar minha própria API de IA' : 'Usar API de IA do administrador'}
              </button>
            </div>
          </div>
          {!localUseGlobalAi && (
            <div className="mt-2 flex flex-col gap-1">
              <label className="text-[10px] font-medium text-slate-600">Sua API de IA</label>
              <input
                type="password"
                value={aiKey}
                onChange={(e) => setAiKey(e.target.value)}
                placeholder="Informe a API de IA que você contratou"
                className="h-9 w-full px-2 rounded-md border border-slate-200 bg-white text-[11px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-violet-400/80"
              />
              <p className="text-[10px] text-amber-600">
                Esta chave é sensível e pertence à sua conta. Não compartilhe telas ou exports que a exibam.
              </p>
            </div>
          )}
        </div>
      </div>

      <div>
        <button
          type="button"
          className="px-3 py-1.5 rounded-md text-[11px] font-medium bg-emerald-500 text-white hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Salvando…' : 'Salvar minhas configurações'}
        </button>
      </div>
    </section>
  )
}
