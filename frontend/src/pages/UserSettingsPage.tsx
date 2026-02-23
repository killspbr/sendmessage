import { useEffect, useState } from 'react'

type UserSettingsPageProps = {
  userSettings: {
    use_global_ai: boolean
    ai_api_key: string | null
    webhook_whatsapp_url: string | null
    webhook_email_url: string | null
  } | null
  onSaveOverrides: (overrides: {
    aiApiKey: string | null
    webhookWhatsappUrl?: string | null
    webhookEmailUrl?: string | null
  }) => Promise<void> | void
}

export function UserSettingsPage({ userSettings, onSaveOverrides }: UserSettingsPageProps) {
  const useGlobalAi = userSettings?.use_global_ai ?? true

  const [aiKey, setAiKey] = useState(userSettings?.ai_api_key ?? '')
  const [whatsappWebhook, setWhatsappWebhook] = useState(userSettings?.webhook_whatsapp_url ?? '')
  const [emailWebhook, setEmailWebhook] = useState(userSettings?.webhook_email_url ?? '')
  const [saving, setSaving] = useState(false)

  const [localUseGlobalAi, setLocalUseGlobalAi] = useState(useGlobalAi)

  useEffect(() => {
    setAiKey(userSettings?.ai_api_key ?? '')
    setWhatsappWebhook(userSettings?.webhook_whatsapp_url ?? '')
    setEmailWebhook(userSettings?.webhook_email_url ?? '')
  }, [userSettings])

  useEffect(() => {
    setLocalUseGlobalAi(useGlobalAi)
  }, [useGlobalAi])

  const handleSave = async () => {
    if (saving) return
    setSaving(true)
    try {
      await onSaveOverrides({
        aiApiKey: localUseGlobalAi ? null : aiKey.trim() || null,
        webhookWhatsappUrl: whatsappWebhook.trim() || null,
        webhookEmailUrl: emailWebhook.trim() || null,
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
          Personalize seus endereços de integração e chaves de IA. Caso deixe em branco, o sistema usará os valores globais definidos pelo administrador.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {/* Webhooks de Integração */}
        <div>
          <h3 className="text-xs font-semibold text-slate-800">Canais de Disparo (Webhooks)</h3>
          <p className="text-[10px] text-slate-500 mb-2">
            Configure seus próprios webhooks do n8n/make se desejar usar contas de disparo diferentes das globais.
          </p>

          <div className="space-y-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-medium text-slate-600">Meu Webhook WhatsApp</label>
              <input
                type="text"
                value={whatsappWebhook}
                onChange={(e) => setWhatsappWebhook(e.target.value)}
                placeholder="https://seu-n8n.com/webhook/..."
                className="h-9 w-full px-2 rounded-md border border-slate-200 bg-white text-[11px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-violet-400/80"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-medium text-slate-600">Meu Webhook Email</label>
              <input
                type="text"
                value={emailWebhook}
                onChange={(e) => setEmailWebhook(e.target.value)}
                placeholder="https://seu-n8n.com/webhook/..."
                className="h-9 w-full px-2 rounded-md border border-slate-200 bg-white text-[11px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-violet-400/80"
              />
            </div>
          </div>
        </div>

        <hr className="border-slate-100 my-1" />

        {/* Integração com IA */}
        <div>
          <h3 className="text-xs font-semibold text-slate-800">Integração com IA (Google Gemini)</h3>
          <div className="mt-1 flex flex-col gap-1.5">
            <p className="text-[11px] text-slate-500">
              {localUseGlobalAi
                ? 'Sua conta está usando a API de IA global do sistema. Para volume maior ou resultados personalizados, use sua própria chave.'
                : 'Você está usando sua própria chave de API para as funções de IA.'}
            </p>
            <div>
              <button
                type="button"
                className="px-2 py-1 rounded-md border border-slate-200 bg-slate-50 text-[10px] font-medium text-slate-700 hover:bg-slate-100"
                onClick={() => setLocalUseGlobalAi((prev) => !prev)}
              >
                {localUseGlobalAi ? 'Usar minha própria API de IA' : 'Usar API de IA global'}
              </button>
            </div>
          </div>
          {!localUseGlobalAi && (
            <div className="mt-2 flex flex-col gap-1">
              <label className="text-[10px] font-medium text-slate-600">Sua API Key</label>
              <input
                type="password"
                value={aiKey}
                onChange={(e) => setAiKey(e.target.value)}
                placeholder="AIza..."
                className="h-9 w-full px-2 rounded-md border border-slate-200 bg-white text-[11px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-violet-400/80"
              />
            </div>
          )}
        </div>
      </div>

      <div className="pt-2">
        <button
          type="button"
          className="px-4 py-2 rounded-md text-[11px] font-semibold bg-emerald-500 text-white hover:bg-emerald-400 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Salvando…' : 'Salvar minhas configurações'}
        </button>
      </div>
    </section>
  )
}
