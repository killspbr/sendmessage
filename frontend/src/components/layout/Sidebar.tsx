import { useState } from 'react'

export type SidebarPage = 'dashboard' | 'contacts' | 'campaigns' | 'schedules' | 'settings' | 'reports' | 'admin' | 'profile' | 'extract'

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
}

export function Sidebar({ currentPage, onChangePage, can, userEmail, userName, onSignOut, impersonatedUserId, onClearImpersonation }: SidebarProps) {
  const [campaignsOpen, setCampaignsOpen] = useState(true)
  const canViewDashboard = !can || can('dashboard.view')
  const canViewContacts = !can || can('contacts.view')
  const canViewCampaigns = !can || can('campaigns.view')
  const canViewSettings = !can || can('settings.view')
  // Relatórios: visível apenas se não houver controle de permissão ou se o grupo tiver reports.view
  const canViewReports = !can || can('reports.view')
  const canViewAdmin = !can || can('admin.users')

  return (
    <aside className="w-16 md:w-60 shrink-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 flex flex-col border-r border-slate-900/60 h-screen sticky top-0">
      <div className="h-14 md:h-16 flex items-center justify-center md:justify-start md:px-5 border-b border-slate-900/80 gap-3">
        <div className="h-8 w-8 md:h-9 md:w-9 rounded-xl bg-white flex items-center justify-center p-1.5 shadow-lg shadow-emerald-900/40">
          <img src="/icons/icon-512x512.png" alt="Logo" className="w-full h-full object-contain" />
        </div>
        <div className="hidden md:flex flex-col">
          <span className="text-sm font-bold tracking-tight text-white">SendMessage</span>
        </div>
      </div>
      <nav className="flex-1 px-2 md:px-3 py-4 text-sm space-y-1">
        {canViewDashboard && (
          <button
            className={`w-full flex items-center justify-center md:justify-start gap-2 px-2 md:px-3 py-2 rounded-xl text-xs font-medium transition ${currentPage === 'dashboard'
                ? 'bg-violet-500/20 border border-violet-400/50 text-slate-50 shadow-sm shadow-violet-600/40'
                : 'text-slate-400 hover:bg-slate-900/80 hover:text-slate-50'
              }`}
            onClick={() => onChangePage('dashboard')}
            title="Dashboard"
          >
            <span className="h-6 w-6 rounded-lg bg-slate-900/80 flex items-center justify-center text-[11px]">🏠</span>
            <span className="hidden md:inline text-xs">Dashboard</span>
          </button>
        )}
        {canViewReports && (
          <button
            className={`w-full flex items-center justify-center md:justify-start gap-2 px-2 md:px-3 py-2 rounded-xl text-xs font-medium transition ${currentPage === 'reports'
                ? 'bg-violet-500/20 border border-violet-400/50 text-slate-50 shadow-sm shadow-violet-600/40'
                : 'text-slate-400 hover:bg-slate-900/80 hover:text-slate-50'
              }`}
            onClick={() => onChangePage('reports')}
            title="Relatórios"
          >
            <span className="h-6 w-6 rounded-lg bg-slate-900/80 flex items-center justify-center text-[11px]">📊</span>
            <span className="hidden md:inline text-xs">Relatórios</span>
          </button>
        )}
        {canViewContacts && (
          <button
            className={`w-full flex items-center justify-center md:justify-start gap-2 px-2 md:px-3 py-2 rounded-xl text-xs font-medium transition ${currentPage === 'contacts'
                ? 'bg-violet-500/20 border border-violet-400/50 text-slate-50 shadow-sm shadow-violet-600/40'
                : 'text-slate-400 hover:bg-slate-900/80 hover:text-slate-50'
              }`}
            onClick={() => onChangePage('contacts')}
            title="Contatos"
          >
            <span className="h-6 w-6 rounded-lg bg-slate-900/80 flex items-center justify-center text-[11px]">👥</span>
            <span className="hidden md:inline text-xs">Contatos</span>
          </button>
        )}
        <button
          className={`w-full flex items-center justify-center md:justify-start gap-2 px-2 md:px-3 py-2 rounded-xl text-xs font-medium transition ${currentPage === 'extract'
              ? 'bg-violet-500/20 border border-violet-400/50 text-slate-50 shadow-sm shadow-violet-600/40'
              : 'text-slate-400 hover:bg-slate-900/80 hover:text-slate-50'
            }`}
          onClick={() => onChangePage('extract')}
          title="Extrair Contatos com IA"
        >
          <span className="h-6 w-6 rounded-lg bg-slate-900/80 flex items-center justify-center text-[11px]">📥</span>
          <span className="hidden md:inline text-xs">Extrair</span>
        </button>
        {canViewCampaigns && (
          <div className="space-y-1">
            <button
              type="button"
              className="w-full flex items-center justify-center md:justify-between gap-2 px-2 md:px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:bg-slate-900/80 hover:text-slate-50"
              onClick={() => setCampaignsOpen((v: boolean) => !v)}
              title="Campanhas"
            >
              <span className="flex items-center gap-2">
                <span className="h-6 w-6 rounded-lg bg-slate-900/80 flex items-center justify-center text-[11px]">📣</span>
                <span className="hidden md:inline text-xs">Campanhas</span>
              </span>
              <span className="hidden md:inline text-[9px] text-slate-500">{campaignsOpen ? '▼' : '▲'}</span>
            </button>

            {campaignsOpen && (
              <div className="ml-0 md:ml-6 space-y-1">
                <button
                  className={`w-full flex items-center justify-center md:justify-start gap-2 px-2 md:px-3 py-1.5 rounded-xl text-xs font-medium transition ${currentPage === 'campaigns'
                      ? 'bg-violet-500/20 border border-violet-400/50 text-slate-50 shadow-sm shadow-violet-600/40'
                      : 'text-slate-400 hover:bg-slate-900/80 hover:text-slate-50'
                    }`}
                  onClick={() => onChangePage('campaigns')}
                  title="Campanhas"
                >
                  <span className="hidden md:inline text-xs">Campanhas</span>
                </button>

                <button
                  className={`w-full flex items-center justify-center md:justify-start gap-2 px-2 md:px-3 py-1.5 rounded-xl text-xs font-medium transition ${currentPage === 'schedules'
                      ? 'bg-violet-500/20 border border-violet-400/50 text-slate-50 shadow-sm shadow-violet-600/40'
                      : 'text-slate-400 hover:bg-slate-900/80 hover:text-slate-50'
                    }`}
                  onClick={() => onChangePage('schedules')}
                  title="Agendamentos"
                >
                  <span className="hidden md:inline text-xs">Agendamentos</span>
                </button>
              </div>
            )}
          </div>
        )}
        {canViewSettings && (
          <button
            className={`w-full flex items-center justify-center md:justify-start gap-2 px-2 md:px-3 py-2 rounded-xl text-xs font-medium transition ${currentPage === 'settings'
                ? 'bg-violet-500/20 border border-violet-400/50 text-slate-50 shadow-sm shadow-violet-600/40'
                : 'text-slate-400 hover:bg-slate-900/80 hover:text-slate-50'
              }`}
            onClick={() => onChangePage('settings')}
            title="Configurações"
          >
            <span className="h-6 w-6 rounded-lg bg-slate-900/80 flex items-center justify-center text-[11px]">⚙️</span>
            <span className="hidden md:inline text-xs">Configurações</span>
          </button>
        )}
        {canViewAdmin && (
          <button
            className={`w-full flex items-center justify-center md:justify-start gap-2 px-2 md:px-3 py-2 rounded-xl text-xs font-medium transition ${currentPage === 'admin'
                ? 'bg-violet-500/20 border border-violet-400/50 text-slate-50 shadow-sm shadow-violet-600/40'
                : 'text-slate-400 hover:bg-slate-900/80 hover:text-slate-50'
              }`}
            onClick={() => onChangePage('admin')}
            title="Usuários & Grupos"
          >
            <span className="h-6 w-6 rounded-lg bg-slate-900/80 flex items-center justify-center text-[11px]">👤</span>
            <span className="hidden md:inline text-xs">Usuários &amp; Grupos</span>
          </button>
        )}
      </nav>
      {userEmail && onSignOut && (
        <div className="px-2 md:px-3 pb-3 mt-auto">
          <div className="w-full rounded-2xl border border-slate-800/80 bg-slate-950/70 px-2.5 py-2 flex flex-col gap-1 text-[10px] md:text-[11px]">
            <div className="flex items-center gap-2">
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-[9px] text-slate-500">Logado como</span>
                <button
                  type="button"
                  className="text-left text-[11px] font-medium text-slate-50 truncate hover:underline"
                  onClick={() => onChangePage('profile')}
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
