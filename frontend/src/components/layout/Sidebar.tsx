import { useState } from 'react'

export type SidebarPage = 'dashboard' | 'contacts' | 'campaigns' | 'schedules' | 'settings' | 'reports' | 'admin' | 'warmer' | 'profile' | 'gemini-keys' | 'security'

type SidebarProps = {
  currentPage: SidebarPage
  onChangePage: (page: SidebarPage) => void
  // Função opcional de permissão. Se não for passada, todos os itens aparecem.
  can?: (code: string) => boolean
  userEmail?: string | null
  userName?: string | null
  onSignOut?: () => void
  impersonatedUserId?: string | null
  onClearImpersonation?: () => void
  isMobileMenuOpen?: boolean
  onCloseMobileMenu?: () => void
}

export function Sidebar({ currentPage, onChangePage, can, userEmail, userName, onSignOut, impersonatedUserId, onClearImpersonation, isMobileMenuOpen, onCloseMobileMenu }: SidebarProps) {
  const [campaignsOpen, setCampaignsOpen] = useState(true)
  const canViewDashboard = !can || can('dashboard.view')
  const canViewContacts = !can || can('contacts.view')
  const canViewCampaigns = !can || can('campaigns.view')
  const canViewSettings = !can || can('settings.view')
  // Relatórios: visível apenas se não houver controle de permissão ou se o grupo tiver reports.view
  const canViewReports = !can || can('reports.view')
  const canViewAdmin = !can || can('admin.users')

  const handlePageChange = (page: SidebarPage) => {
    onChangePage(page)
    onCloseMobileMenu?.()
  }

  return (
    <aside className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 w-[260px] md:w-60 shrink-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 flex flex-col border-r border-slate-900/60 h-screen`}>
      <div className="h-14 md:h-16 flex items-center justify-start px-4 md:px-5 border-b border-slate-900/80 gap-3">
        <div className="h-8 w-8 md:h-9 md:w-9 rounded-xl bg-white flex items-center justify-center p-1.5 shadow-lg shadow-emerald-900/40 shrink-0">
          <img src="/icons/icon-512x512.png" alt="Logo" className="w-full h-full object-contain" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold tracking-tight text-white">SendMessage</span>
        </div>
        <button 
          onClick={onCloseMobileMenu}
          className="md:hidden ml-auto p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <nav className="flex-1 px-2 md:px-3 py-4 text-sm space-y-1">
        {canViewDashboard && (
          <button
            className={`w-full flex items-center justify-start gap-2 px-3 py-2 rounded-xl text-xs font-medium transition ${currentPage === 'dashboard'
                ? 'bg-emerald-500/20 border border-emerald-400/50 text-slate-50 shadow-sm shadow-emerald-600/40'
                : 'text-slate-400 hover:bg-slate-900/80 hover:text-slate-50'
              }`}
            onClick={() => handlePageChange('dashboard')}
            title="Dashboard"
          >
            <span className="h-6 w-6 rounded-lg bg-slate-900/80 flex items-center justify-center text-[11px] shrink-0">🏠</span>
            <span className="inline text-xs">Dashboard</span>
          </button>
        )}
        {canViewReports && (
          <button
            className={`w-full flex items-center justify-start gap-2 px-3 py-2 rounded-xl text-xs font-medium transition ${currentPage === 'reports'
                ? 'bg-emerald-500/20 border border-emerald-400/50 text-slate-50 shadow-sm shadow-emerald-600/40'
                : 'text-slate-400 hover:bg-slate-900/80 hover:text-slate-50'
              }`}
            onClick={() => handlePageChange('reports')}
            title="Relatórios"
          >
            <span className="h-6 w-6 rounded-lg bg-slate-900/80 flex items-center justify-center text-[11px] shrink-0">📊</span>
            <span className="inline text-xs">Relatórios</span>
          </button>
        )}
        {canViewContacts && (
          <button
            className={`w-full flex items-center justify-start gap-2 px-3 py-2 rounded-xl text-xs font-medium transition ${currentPage === 'contacts'
                ? 'bg-emerald-500/20 border border-emerald-400/50 text-slate-50 shadow-sm shadow-emerald-600/40'
                : 'text-slate-400 hover:bg-slate-900/80 hover:text-slate-50'
              }`}
            onClick={() => handlePageChange('contacts')}
            title="Contatos"
          >
            <span className="h-6 w-6 rounded-lg bg-slate-900/80 flex items-center justify-center text-[11px] shrink-0">👥</span>
            <span className="inline text-xs">Contatos</span>
          </button>
        )}
        {canViewCampaigns && (
          <div className="space-y-1">
            <button
              type="button"
              className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:bg-slate-900/80 hover:text-slate-50"
              onClick={() => setCampaignsOpen((v: boolean) => !v)}
              title="Campanhas"
            >
              <span className="flex items-center gap-2">
                <span className="h-6 w-6 rounded-lg bg-slate-900/80 flex items-center justify-center text-[11px] shrink-0">📣</span>
                <span className="inline text-xs">Gerenciar Envios</span>
              </span>
              <span className="inline text-[9px] text-slate-500">{campaignsOpen ? '▼' : '▲'}</span>
            </button>

            {campaignsOpen && (
              <div className="ml-0 md:ml-6 space-y-1">
                <button
                  className={`w-full flex items-center justify-start gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition ${currentPage === 'campaigns'
                      ? 'bg-emerald-500/20 border border-emerald-400/50 text-slate-50 shadow-sm shadow-emerald-600/40'
                      : 'text-slate-400 hover:bg-slate-900/80 hover:text-slate-50'
                    }`}
                  onClick={() => handlePageChange('campaigns')}
                  title="Campanhas"
                >
                  <span className="inline text-xs">Campanhas</span>
                </button>

                <button
                  className={`w-full flex items-center justify-start gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition ${currentPage === 'schedules'
                      ? 'bg-emerald-500/20 border border-emerald-400/50 text-slate-50 shadow-sm shadow-emerald-600/40'
                      : 'text-slate-400 hover:bg-slate-900/80 hover:text-slate-50'
                    }`}
                  onClick={() => handlePageChange('schedules')}
                  title="Agendamentos"
                >
                  <span className="inline text-xs">Agendamentos</span>
                </button>
              </div>
            )}
          </div>
        )}
        {canViewSettings && (
          <div className="space-y-1">
            <button
              className={`w-full flex items-center justify-start gap-2 px-3 py-2 rounded-xl text-xs font-medium transition ${currentPage === 'settings'
                  ? 'bg-emerald-500/20 border border-emerald-400/50 text-slate-50 shadow-sm shadow-emerald-600/40'
                  : 'text-slate-400 hover:bg-slate-900/80 hover:text-slate-50'
                }`}
              onClick={() => handlePageChange('settings')}
              title="Configurações"
            >
              <span className="h-6 w-6 rounded-lg bg-slate-900/80 flex items-center justify-center text-[11px] shrink-0">⚙️</span>
              <span className="inline text-xs">Configurações</span>
            </button>
            <button
              className={`w-full flex items-center justify-start gap-2 px-3 py-2 rounded-xl text-xs font-medium transition ${currentPage === 'security'
                  ? 'bg-emerald-500/20 border border-emerald-400/50 text-slate-50 shadow-sm shadow-emerald-600/40'
                  : 'text-slate-400 hover:bg-slate-900/80 hover:text-slate-50'
                }`}
              onClick={() => handlePageChange('security')}
              title="Painel de Segurança"
            >
              <span className="h-6 w-6 rounded-lg bg-slate-900/80 flex items-center justify-center text-[11px] shrink-0">🛡️</span>
              <span className="inline text-xs">Segurança Operacional</span>
            </button>
            <button
              className={`w-full flex items-center justify-start gap-2 px-3 py-2 rounded-xl text-xs font-medium transition ${currentPage === 'gemini-keys'
                  ? 'bg-emerald-500/20 border border-emerald-400/50 text-slate-50 shadow-sm shadow-emerald-600/40'
                  : 'text-slate-400 hover:bg-slate-900/80 hover:text-slate-50'
                }`}
              onClick={() => handlePageChange('gemini-keys')}
              title="Gerenciar APIs Gemini"
            >
              <span className="h-6 w-6 rounded-lg bg-slate-900/80 flex items-center justify-center text-[11px] shrink-0">🤖</span>
              <span className="inline text-xs">APIs Gemini</span>
            </button>
          </div>
        )}
        {canViewAdmin && (
          <button
            className={`w-full flex items-center justify-start gap-2 px-3 py-2 rounded-xl text-xs font-medium transition ${currentPage === 'admin'
                ? 'bg-emerald-500/20 border border-emerald-400/50 text-slate-50 shadow-sm shadow-emerald-600/40'
                : 'text-slate-400 hover:bg-slate-900/80 hover:text-slate-50'
              }`}
            onClick={() => handlePageChange('admin')}
            title="Usuários & Grupos"
          >
            <span className="h-6 w-6 rounded-lg bg-slate-900/80 flex items-center justify-center text-[11px] shrink-0">👤</span>
            <span className="inline text-xs">Usuários &amp; Grupos</span>
          </button>
        )}
        {canViewAdmin && (
          <button
            className={`w-full flex items-center justify-start gap-2 px-3 py-2 rounded-xl text-xs font-medium transition ${currentPage === 'warmer'
                ? 'bg-emerald-500/20 border border-emerald-400/50 text-slate-50 shadow-sm shadow-emerald-600/40'
                : 'text-slate-400 hover:bg-slate-900/80 hover:text-slate-50'
              }`}
            onClick={() => handlePageChange('warmer')}
            title="Laboratorio de Instancias"
          >
            <span className="h-6 w-6 rounded-lg bg-slate-900/80 flex items-center justify-center text-[11px] shrink-0">🧬</span>
            <span className="inline text-xs">Laboratorio</span>
          </button>
        )}
      </nav>
      {userEmail && onSignOut && (
        <div className="px-3 pb-3 mt-auto">
          <div className="w-full rounded-2xl border border-slate-800/80 bg-slate-950/70 px-3 py-2 flex flex-col gap-1 text-[11px]">
            <div className="flex items-center gap-2">
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-[9px] text-slate-500">Logado como</span>
                <button
                  type="button"
                  className="text-left text-[11px] font-medium text-slate-50 truncate hover:underline"
                  onClick={() => handlePageChange('profile')}
                  title="Abrir meu perfil e configurações pessoais"
                >
                  {userName || userEmail}
                </button>
              </div>
              <button
                type="button"
                className="ml-auto h-7 px-2.5 rounded-lg text-[10px] font-medium bg-slate-100 text-slate-900 hover:bg-white border border-slate-300"
                onClick={onSignOut}
              >
                Sair
              </button>
            </div>

            {impersonatedUserId && onClearImpersonation && (
              <div className="mt-0.5 flex items-center justify-between gap-2 text-[9px] text-amber-300">
                <span className="truncate">
                  Vendo como outro usuário
                </span>
                <button
                  type="button"
                  className="h-6 px-2 rounded-md text-[9px] font-medium border border-amber-300 bg-amber-500 text-slate-950 hover:bg-amber-400 leading-tight"
                  onClick={onClearImpersonation}
                >
                  <span className="block">Voltar para</span>
                  <span className="block">minha conta</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  )
}
