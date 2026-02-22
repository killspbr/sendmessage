type AuthPageProps = {
  authMode: 'login' | 'signup'
  authEmail: string
  authPassword: string
  authName: string
  authError: string | null
  rememberMe: boolean
  onSetAuthMode: (mode: 'login' | 'signup') => void
  onSetAuthEmail: (email: string) => void
  onSetAuthPassword: (password: string) => void
  onSetAuthName: (name: string) => void
  onToggleRememberMe: () => void
  onSetAuthError: (error: string | null) => void
  onSubmit: () => void
}

export function AuthPage({
  authMode,
  authEmail,
  authPassword,
  authName,
  authError,
  rememberMe,
  onSetAuthMode,
  onSetAuthEmail,
  onSetAuthPassword,
  onSetAuthName,
  onToggleRememberMe,
  onSetAuthError,
  onSubmit,
}: AuthPageProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-6 space-y-4 text-slate-50">
        <div className="flex items-center gap-3 mb-1">
          <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-lg shadow-lg shadow-violet-700/40">
            <span aria-hidden="true">
              📨
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-tight">CL Marketing</span>
            <span className="text-[11px] text-slate-400">Acesse sua conta para ver contatos e campanhas.</span>
          </div>
        </div>

        <div className="flex gap-1 rounded-full bg-slate-800/80 p-1 text-[11px]">
          <button
            type="button"
            className={`flex-1 px-3 py-1.5 rounded-full font-medium transition ${
              authMode === 'login'
                ? 'bg-slate-50 text-slate-900 shadow-sm'
                : 'text-slate-300 hover:text-slate-50'
            }`}
            onClick={() => {
              onSetAuthMode('login')
              onSetAuthError(null)
            }}
          >
            Entrar
          </button>
          <button
            type="button"
            className={`flex-1 px-3 py-1.5 rounded-full font-medium transition ${
              authMode === 'signup'
                ? 'bg-slate-50 text-slate-900 shadow-sm'
                : 'text-slate-300 hover:text-slate-50'
            }`}
            onClick={() => {
              onSetAuthMode('signup')
              onSetAuthError(null)
            }}
          >
            Criar conta
          </button>
        </div>

        <form
          className="space-y-2"
          onSubmit={(e) => {
            e.preventDefault()
            onSubmit()
          }}
        >
          {authMode === 'signup' && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-slate-200">Nome</label>
              <input
                type="text"
                value={authName}
                onChange={(e) => onSetAuthName(e.target.value)}
                className="w-full h-9 px-3 rounded-md border border-slate-700 bg-slate-900 text-[12px] text-slate-50 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-400/80"
                placeholder="Seu nome"
                autoComplete="name"
              />
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-slate-200">Email</label>
            <input
              type="email"
              value={authEmail}
              onChange={(e) => onSetAuthEmail(e.target.value)}
              className="w-full h-9 px-3 rounded-md border border-slate-700 bg-slate-900 text-[12px] text-slate-50 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-400/80"
              placeholder="voce@empresa.com"
              autoComplete="email"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-slate-200">Senha</label>
            <input
              type="password"
              value={authPassword}
              onChange={(e) => onSetAuthPassword(e.target.value)}
              className="w-full h-9 px-3 rounded-md border border-slate-700 bg-slate-900 text-[12px] text-slate-50 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-400/80"
              placeholder="Mínimo 6 caracteres"
              autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
            />
          </div>

          {authError && (
            <p className="text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/40 rounded-md px-3 py-1.5">
              {authError}
            </p>
          )}

          <div className="flex items-center justify-between gap-3 text-[10px] text-slate-400">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <span className="text-[10px]">Lembrar de mim neste dispositivo</span>
              <button
                type="button"
                onClick={onToggleRememberMe}
                className={`relative inline-flex h-4 w-7 items-center rounded-full border transition-colors ${
                  rememberMe ? 'bg-emerald-500 border-emerald-600' : 'bg-slate-700 border-slate-600'
                }`}
                aria-pressed={rememberMe}
              >
                <span
                  className={`inline-block h-3 w-3 transform rounded-full bg-white shadow transition-transform ${
                    rememberMe ? 'translate-x-3' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </label>
          </div>

          <button
            type="submit"
            className="w-full h-9 rounded-md bg-violet-500 hover:bg-violet-400 text-[12px] font-semibold text-white shadow-md shadow-violet-700/40 flex items-center justify-center"
          >
            {authMode === 'login' ? 'Entrar' : 'Criar conta'}
          </button>
        </form>

        <p className="text-[10px] text-slate-500 mt-1">
          As campanhas e contatos ficam isolados por usuário. Cada login enxerga somente os próprios dados.
        </p>
      </div>
    </div>
  )
}
