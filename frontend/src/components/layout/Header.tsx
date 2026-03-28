import React from 'react'

export type HeaderPage = 'dashboard' | 'contacts' | 'campaigns' | 'schedules' | 'settings' | 'reports' | 'admin' | 'warmer' | 'profile' | 'extract' | 'gemini-keys' | 'security'

type HeaderProps = {
  currentPage: HeaderPage
  onImportCsv?: (e: React.ChangeEvent<HTMLInputElement>) => void
  onExportCsv?: () => void
  onToggleMobileMenu?: () => void
}

export function Header({ currentPage, onImportCsv, onExportCsv, onToggleMobileMenu }: HeaderProps) {
  const title =
    currentPage === 'dashboard'
      ? 'Dashboard'
      : currentPage === 'contacts'
        ? 'Contatos'
        : currentPage === 'campaigns'
          ? 'Campanhas'
          : currentPage === 'schedules'
            ? 'Agendamentos de campanhas'
            : currentPage === 'settings'
              ? 'Configurações'
              : currentPage === 'reports'
                ? 'Relatórios'
                : currentPage === 'admin'
                  ? 'Usuários & Grupos'
                  : currentPage === 'warmer'
                    ? 'Maturador de Chips'
                    : currentPage === 'profile'
                      ? 'Meu perfil'
                    : currentPage === 'extract'
                      ? 'Extrair contatos'
                      : currentPage === 'gemini-keys'
                        ? 'APIs Gemini'
                        : currentPage === 'security'
                          ? 'Segurança Operacional'
                          : 'Contatos'

  const subtitle =
    currentPage === 'dashboard'
      ? 'Visão geral dos seus contatos e campanhas.'
      : currentPage === 'contacts'
        ? 'Gerencie e organize sua base de contatos.'
        : currentPage === 'campaigns'
          ? 'Monte e dispare campanhas para suas listas.'
          : currentPage === 'schedules'
            ? 'Veja e acompanhe os envios programados.'
            : currentPage === 'settings'
              ? 'Configure integrações e preferências do sistema.'
              : currentPage === 'reports'
                ? 'Analise desempenho de envios por campanha e período.'
                : currentPage === 'admin'
                  ? 'Controle quais usuários podem acessar o sistema, seus grupos e permissões.'
                  : currentPage === 'warmer'
                    ? 'Sistema automático de aquecimento e conversação entre instâncias WhatsApp.'
                    : currentPage === 'profile'
                      ? 'Ajuste suas preferências pessoais de IA e webhooks.'
                    : currentPage === 'extract'
                      ? 'Extraia informações de imagens com Inteligência Artificial.'
                      : currentPage === 'gemini-keys'
                        ? 'Gerenciamento de múltiplas chaves da API do Gemini.'
                        : currentPage === 'security'
                          ? 'Monitoramento de saúde da conta e comportamento de envio.'
                          : 'Gerencie suas listas e prepare envios via n8n.'

  return (
    <header className="h-14 md:h-16 shrink-0 border-b border-slate-200 bg-white/80 backdrop-blur flex items-center justify-between px-3 md:px-6">
      <div className="flex items-center gap-2 md:gap-3 min-w-0">
        {onToggleMobileMenu && (
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="md:hidden p-1.5 -ml-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 focus:outline-none transition-colors"
            title="Menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
        <div className="min-w-0">
          <h1 className="text-base md:text-xl font-semibold tracking-tight truncate">{title}</h1>
          <p className="hidden md:block text-[11px] text-slate-500">{subtitle}</p>
        </div>
      </div>
      {currentPage === 'contacts' && (onImportCsv || onExportCsv) && (
        <div className="flex items-center gap-1 md:gap-2">
          {onImportCsv && (
            <label className="px-2 md:px-3 py-1 md:py-1.5 rounded-md text-[10px] md:text-xs font-medium border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer">
              <span className="hidden md:inline">Importar CSV</span>
              <span className="md:hidden">📥</span>
              <input
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={onImportCsv}
              />
            </label>
          )}
          {onExportCsv && (
            <button
              className="px-2 md:px-3 py-1 md:py-1.5 rounded-md text-[10px] md:text-xs font-medium border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              onClick={onExportCsv}
            >
              <span className="hidden md:inline">Exportar CSV</span>
              <span className="md:hidden">📤</span>
            </button>
          )}
        </div>
      )}
    </header>
  )
}
