type UserSettingsPageProps = {
  effectiveUserId: string | null
  useGlobalAi: boolean
  userAiKey: string
  userCompanyInfo: string | null
  onChangeUseGlobalAi: (val: boolean) => void
  onChangeUserAiKey: (val: string) => void
  onChangeUserCompanyInfo: (val: string) => void
  // Webhooks/Email
  useGlobalWebhooks: boolean
  userWebhookEmail: string
  onChangeUseGlobalWebhooks: (val: boolean) => void
  onChangeUserWebhookEmail: (val: string) => void
  // Evolution (Por usuário)
  userEvolutionUrl: string
  userEvolutionApiKey: string
  userEvolutionInstance: string
  onChangeUserEvolutionUrl: (val: string) => void
  onChangeUserEvolutionApiKey: (val: string) => void
  onChangeUserEvolutionInstance: (val: string) => void
  // Ações
  onSave: (overrides: {
    aiApiKey: string | null
    webhookEmailUrl?: string | null
    evolutionUrl?: string | null
    evolutionApiKey?: string | null
    evolutionInstance?: string | null
    companyInfo?: string | null
  }) => Promise<void>
}

export function UserSettingsPage({
  useGlobalAi,
  userAiKey,
  onChangeUseGlobalAi,
  onChangeUserAiKey,
  userCompanyInfo,
  onChangeUserCompanyInfo,
  useGlobalWebhooks,
  userWebhookEmail,
  onChangeUseGlobalWebhooks,
  onChangeUserWebhookEmail,
  userEvolutionUrl,
  userEvolutionApiKey,
  userEvolutionInstance,
  onChangeUserEvolutionUrl,
  onChangeUserEvolutionApiKey,
  onChangeUserEvolutionInstance,
  onSave,
}: UserSettingsPageProps) {
  const handleSave = async () => {
    await onSave({
      aiApiKey: useGlobalAi ? null : userAiKey,
      webhookEmailUrl: useGlobalWebhooks ? undefined : userWebhookEmail,
      evolutionUrl: userEvolutionUrl.trim() || undefined,
      evolutionApiKey: userEvolutionApiKey.trim() || undefined,
      evolutionInstance: userEvolutionInstance.trim() || undefined,
      companyInfo: userCompanyInfo?.trim() || undefined,
    })
  }

  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-xl p-6 md:p-8 flex flex-col gap-8 max-w-2xl mx-auto motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
      {/* Evolution API - Por Usuário */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">Evolução WhatsApp (Instância Própria)</h2>
            <p className="text-xs text-slate-500 font-medium">Use sua própria instância da Evolution API para envios exclusivos.</p>
          </div>
        </div>

        <div className="grid gap-4 mt-2 p-5 rounded-2xl bg-slate-50 border border-slate-100">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700 ml-1">Evolution API URL</label>
            <input
              type="text"
              value={userEvolutionUrl}
              onChange={(e) => onChangeUserEvolutionUrl(e.target.value)}
              placeholder="https://sua-api.evolution.com (vazio para usar global)"
              className="h-11 w-full px-4 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700 ml-1">Sua API Key</label>
              <input
                type="password"
                value={userEvolutionApiKey}
                onChange={(e) => onChangeUserEvolutionApiKey(e.target.value)}
                placeholder="ApiKey da sua instância"
                className="h-11 w-full px-4 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700 ml-1">Sua Instância</label>
              <input
                type="text"
                value={userEvolutionInstance}
                onChange={(e) => onChangeUserEvolutionInstance(e.target.value)}
                placeholder="Nome da sua instância"
                className="h-11 w-full px-4 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Webhooks / Email */}
      <div className="space-y-4 pt-4 border-t border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center text-violet-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">Email (n8n Webhook)</h2>
            <p className="text-xs text-slate-500 font-medium">Configure seu próprio fluxo de e-mail se desejar.</p>
          </div>
        </div>

        <div className="space-y-4 p-5 rounded-2xl bg-slate-50 border border-slate-100">
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative">
              <input
                type="checkbox"
                checked={useGlobalWebhooks}
                onChange={(e) => onChangeUseGlobalWebhooks(e.target.checked)}
                className="sr-only"
              />
              <div className={`w-10 h-6 rounded-full transition-colors ${useGlobalWebhooks ? 'bg-violet-500' : 'bg-slate-300'}`} />
              <div className={`absolute left-1 top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${useGlobalWebhooks ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
            <span className="text-sm font-bold text-slate-700 group-hover:text-slate-900 transition-colors">Usar webhook de e-mail global</span>
          </label>

          {!useGlobalWebhooks && (
            <div className="flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-2">
              <label className="text-xs font-bold text-slate-700 ml-1">Meu Webhook Email</label>
              <input
                type="text"
                value={userWebhookEmail}
                onChange={(e) => onChangeUserWebhookEmail(e.target.value)}
                placeholder="https://seu-n8n.com/..."
                className="h-11 w-full px-4 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all shadow-sm"
              />
            </div>
          )}
        </div>
      </div>

      {/* IA */}
      <div className="space-y-4 pt-4 border-t border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">Inteligência Artificial</h2>
            <p className="text-xs text-slate-500 font-medium">Use sua própria chave do Gemini para garantir seus limites individuais.</p>
          </div>
        </div>

        <div className="space-y-4 p-5 rounded-2xl bg-slate-50 border border-slate-100">
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative">
              <input
                type="checkbox"
                checked={useGlobalAi}
                onChange={(e) => onChangeUseGlobalAi(e.target.checked)}
                className="sr-only"
              />
              <div className={`w-10 h-6 rounded-full transition-colors ${useGlobalAi ? 'bg-amber-500' : 'bg-slate-300'}`} />
              <div className={`absolute left-1 top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${useGlobalAi ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
            <span className="text-sm font-bold text-slate-700 group-hover:text-slate-900 transition-colors">Usar chave de IA global (limite compartilhado)</span>
          </label>

          {!useGlobalAi && (
            <div className="flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-2">
              <label className="text-xs font-bold text-slate-700 ml-1">Minha Gemini API Key</label>
              <input
                type="password"
                value={userAiKey}
                onChange={(e) => onChangeUserAiKey(e.target.value)}
                placeholder="AIza..."
                className="h-11 w-full px-4 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all shadow-sm"
              />
            </div>
          )}
        </div>

        <div className="space-y-4 p-5 rounded-2xl bg-slate-50 border border-slate-100 mt-4">
          <div className="flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-2">
            <label className="text-xs font-bold text-slate-700 ml-1">Sobre o Remetente (Empresa/Negócio)</label>
            <textarea
              value={userCompanyInfo || ''}
              onChange={(e) => onChangeUserCompanyInfo(e.target.value)}
              placeholder="Descreva sua empresa, diferenciais, público-alvo ou tom de voz. Ex: 'Somos uma padaria familiar focada em produtos artesanais...'"
              rows={4}
              className="w-full p-4 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all shadow-sm resize-none"
            />
            <p className="text-[10px] text-slate-500 ml-1">
              Esses dados serão usados pela IA do Gemini para gerar textos mais personalizados e alinhados com o seu perfil.
            </p>
          </div>
        </div>
      </div>

      <div className="pt-6 border-t border-slate-100">
        <button
          onClick={handleSave}
          className="w-full h-12 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-lg shadow-slate-200 transition-all active:scale-[0.98]"
        >
          Salvar Alterações
        </button>
      </div>
    </section>
  )
}
