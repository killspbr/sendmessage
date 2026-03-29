import type { Campaign, Contact, ContactList, SendHistoryItem, CampaignSendLog } from '../types'

type DashboardPageProps = {
  // Dados
  contactsByList: Record<string, Contact[]>
  contacts: Contact[]
  lists: ContactList[]
  currentListId: string
  campaigns: Campaign[]
  sendHistory: SendHistoryItem[]
  campaignSendLog: Record<string, CampaignSendLog>

  // Estado de envio
  sendingCampaignId: string | null
  sendingCurrentIndex: number
  sendingTotal: number
  sendingErrors: number

  // APIs
  hasEvolutionConfigured: boolean
  activeUserPresence?: import('../types').ActiveUserPresenceSnapshot | null
  showAdminPresenceCard?: boolean
  warmerPairs?: any[]

  // Handlers
  onNavigate: (page: 'dashboard' | 'contacts' | 'campaigns' | 'settings') => void
  onCreateCampaign: () => void
  onEditCampaign: (campaign: Campaign) => void
  onNavigateToWarmer?: () => void
  // Permissões (opcional)
  can?: (code: string) => boolean
}

const Badge = ({ children, variant = 'secondary' }: { children: React.ReactNode, variant?: 'success' | 'warning' | 'error' | 'info' | 'secondary' }) => {
  const styles = {
    success: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    error: 'bg-red-500/10 text-red-600 border-red-500/20',
    info: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    secondary: 'bg-slate-500/10 text-slate-600 border-slate-500/20'
  }

  return (
    <span className={`px-1.5 py-0.5 rounded-full border text-[9px] font-semibold tracking-tight ${styles[variant]}`}>
      {children}
    </span>
  )
}

export function DashboardPage({
  contactsByList,
  contacts,
  lists,
  currentListId,
  campaigns,
  sendHistory,
  campaignSendLog,
  sendingCampaignId,
  sendingCurrentIndex,
  sendingTotal,
  sendingErrors,
  hasEvolutionConfigured,
  activeUserPresence,
  showAdminPresenceCard,
  warmerPairs,
  onNavigate,
  onCreateCampaign,
  onEditCampaign,
  onNavigateToWarmer,
  can,
}: DashboardPageProps) {
  const canViewDashboard = !can || can('dashboard.view')
  const pageLabelMap: Record<string, string> = {
    dashboard: 'Dashboard',
    contacts: 'Contatos',
    campaigns: 'Campanhas',
    schedules: 'Agendamentos',
    settings: 'Configurações',
    reports: 'Relatórios',
    admin: 'Admin',
    profile: 'Perfil',
    'gemini-keys': 'APIs Gemini',
    security: 'Segurança',
  }

  const recentHistory = sendHistory.slice(0, 10)
  const recentTotals = recentHistory.reduce(
    (acc, item) => {
      acc.total += item.total
      acc.errors += item.errorCount
      return acc
    },
    { total: 0, errors: 0 },
  )

  const recentSuccessRate =
    recentTotals.total > 0 ? ((recentTotals.total - recentTotals.errors) / recentTotals.total) * 100 : null

  const recentQualityLabel =
    recentSuccessRate == null
      ? 'Sem dados'
      : recentSuccessRate >= 90
        ? 'Bom'
        : recentSuccessRate >= 70
          ? 'Atenção'
          : 'Crítico'

  if (!canViewDashboard) {
    return (
      <div className="text-[12px] md:text-[13px] text-slate-500 bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        Você não tem permissão para visualizar o dashboard.
      </div>
    )
  }
  return (
    <>
      {/* Seção de Onboarding / Primeiros Passos */}
      {(!hasEvolutionConfigured || contacts.length === 0 || campaigns.length === 0) && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Primeiros Passos</h3>
              <p className="text-[11px] text-slate-500">Complete estas tarefas para começar a enviar suas mensagens</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                {Math.round(((hasEvolutionConfigured ? 1 : 0) + (contacts.length > 0 ? 1 : 0) + (campaigns.length > 0 ? 1 : 0)) / 3 * 100)}% concluído
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100">
            <div className={`p-5 flex flex-col gap-3 transition-colors ${!hasEvolutionConfigured ? 'bg-amber-50/30' : 'bg-white'}`}>
              <div className="flex items-center justify-between">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm ${hasEvolutionConfigured ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                  {hasEvolutionConfigured ? '✓' : '1'}
                </div>
                {!hasEvolutionConfigured && <span className="text-[9px] font-bold text-amber-600 animate-pulse">PENDENTE</span>}
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800">Conectar WhatsApp</h4>
                <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">Configure a API Evolution para habilitar o envio de mensagens via WhatsApp.</p>
              </div>
              <button 
                onClick={() => onNavigate('settings')}
                className={`mt-auto text-[10px] font-bold text-left hover:underline ${hasEvolutionConfigured ? 'text-emerald-600' : 'text-amber-600'}`}
              >
                {hasEvolutionConfigured ? 'Configurações concluídas' : 'Ir para Configurações →'}
              </button>
            </div>

            <div className={`p-5 flex flex-col gap-3 transition-colors ${hasEvolutionConfigured && contacts.length === 0 ? 'bg-amber-50/30' : 'bg-white'}`}>
              <div className="flex items-center justify-between">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm ${contacts.length > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>
                  {contacts.length > 0 ? 'OK' : '2'}
                </div>
                {hasEvolutionConfigured && contacts.length === 0 && <span className="text-[9px] font-bold text-amber-600 animate-pulse">PROXIMO PASSO</span>}
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800">Adicionar Contatos</h4>
                <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">Importe sua lista de contatos via CSV ou adicione manualmente no sistema.</p>
              </div>
              <button 
                onClick={() => onNavigate('contacts')}
                className={`mt-auto text-[10px] font-bold text-left hover:underline ${contacts.length > 0 ? 'text-emerald-600' : 'text-slate-600'}`}
              >
                {contacts.length > 0 ? 'Contatos cadastrados' : 'Gerenciar Contatos ->'}
              </button>
            </div>

            <div className={`p-5 flex flex-col gap-3 transition-colors ${contacts.length > 0 && campaigns.length === 0 ? 'bg-amber-50/30' : 'bg-white'}`}>
              <div className="flex items-center justify-between">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm ${campaigns.length > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>
                  {campaigns.length > 0 ? 'OK' : '3'}
                </div>
                {contacts.length > 0 && campaigns.length === 0 && <span className="text-[9px] font-bold text-amber-600 animate-pulse">QUASE LA</span>}
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800">Criar Campanha</h4>
                <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">Crie sua primeira campanha de mensagens e escolha o publico-alvo.</p>
              </div>
              <button 
                onClick={() => onNavigate('campaigns')}
                className={`mt-auto text-[10px] font-bold text-left hover:underline ${campaigns.length > 0 ? 'text-emerald-600' : 'text-slate-600'}`}
              >
                {campaigns.length > 0 ? 'Campanha criada' : 'Criar Campanha ->'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Banner da Extensao do Navegador */}
      <div className="relative overflow-hidden mb-4 p-4 rounded-3xl bg-gradient-to-r from-emerald-600 to-emerald-800 text-white shadow-xl shadow-emerald-950/20 group">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -mr-10 -mt-10 h-40 w-40 rounded-full bg-white/10 blur-3xl pointer-events-none group-hover:bg-white/20 transition-all duration-700" />
        <div className="absolute bottom-0 left-0 -ml-10 -mb-10 h-32 w-32 rounded-full bg-emerald-400/20 blur-2xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl shadow-inner border border-white/30">
              [EXT]
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">Potencialize sua extracao com nossa extensao</h3>
              <p className="text-[11px] text-emerald-50/80 leading-relaxed max-w-md">
                Extraia contatos diretamente do seu navegador com 1 clique. Mais rapido, seguro e integrado ao seu WhatsApp.
              </p>
            </div>
          </div>
          <div className="flex flex-col items-center md:items-end gap-1.5">
            <a
              href="/extension.zip"
              download="sendmessage-extension.zip"
              className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white text-emerald-700 text-xs font-bold hover:bg-emerald-50 transition-all duration-300 shadow-lg active:scale-95"
            >
              Baixar Agora
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </a>
            <span className="text-[10px] text-emerald-100/90 font-medium px-2">v1.0.9 - 19/03/2026 as 23:59</span>
          </div>
        </div>
      </div>

      {/* KPIs principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col gap-1 transition-all hover:border-emerald-200">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Contatos</span>
            <span className="px-2 py-0.5 rounded-lg bg-emerald-500 text-white font-bold text-[9px] shadow-sm shadow-emerald-200" aria-hidden="true">
              CTT
            </span>
          </div>
          <span className="text-3xl font-bold tracking-tight text-slate-900 mt-1">
            {Object.values(contactsByList).reduce((acc, list) => acc + list.length, 0)}
          </span>
          <span className="text-[10px] text-slate-400 font-medium">Cadastrados em todas as listas</span>
        </div>

        <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-4 flex flex-col gap-1 transition-all hover:border-emerald-300">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Lista Ativa</span>
            <span className="px-2 py-0.5 rounded-lg bg-emerald-600 text-white font-bold text-[9px] shadow-sm shadow-emerald-200" aria-hidden="true">
              LST
            </span>
          </div>
          <span className="text-3xl font-bold tracking-tight text-slate-900 mt-1">{contacts.length}</span>
          <span className="text-[11px] text-emerald-600 font-semibold truncate">
            {lists.find((l) => l.id === currentListId)?.name || 'Sem seleção'}
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col gap-1 transition-all hover:border-sky-200">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Campanhas</span>
            <span className="px-2 py-0.5 rounded-lg bg-sky-500 text-white font-bold text-[9px] shadow-sm shadow-sky-200" aria-hidden="true">
              CMP
            </span>
          </div>
          <span className="text-3xl font-bold tracking-tight text-slate-900 mt-1">{campaigns.length}</span>
          <span className="text-[10px] text-slate-400 font-medium">Recentes e agendadas</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col gap-1 transition-all hover:border-amber-200">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Programados</span>
            <span className="px-2 py-0.5 rounded-lg bg-amber-500 text-white font-bold text-[9px] shadow-sm shadow-amber-200" aria-hidden="true">
              PRG
            </span>
          </div>
          <span className="text-3xl font-bold tracking-tight text-slate-900 mt-1">
            {campaigns.filter((c) => c.status === 'agendada').length}
          </span>
          <span className="text-[10px] text-slate-400 font-medium font-semibold text-amber-600">
            Aguardando disparo
          </span>
        </div>

        <div
          className={`lg:col-span-1 bg-white rounded-2xl border shadow-sm p-4 flex flex-col gap-1 transition-all ${recentSuccessRate == null
            ? 'border-slate-100'
            : recentSuccessRate >= 90
              ? 'border-emerald-200 hover:border-emerald-300'
              : recentSuccessRate >= 70
                ? 'border-amber-200 hover:border-amber-300'
                : 'border-rose-200 hover:border-rose-300'
            }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Taxa de Sucesso</span>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[9px] font-bold ${recentSuccessRate == null
                ? 'bg-slate-100 text-slate-500'
                : recentSuccessRate >= 90
                  ? 'bg-emerald-100 text-emerald-700'
                  : recentSuccessRate >= 70
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-rose-100 text-rose-700'
                }`}
            >
              {recentSuccessRate == null
                ? 'N/A'
                : `${Math.round(recentSuccessRate)}%`}
            </span>
          </div>
          <span className="text-3xl font-bold tracking-tight text-slate-900 mt-1">
             {recentSuccessRate == null ? '...' : recentQualityLabel}
          </span>
          {recentSuccessRate == null ? (
            <span className="text-[10px] text-slate-400">Calculando metricas...</span>
          ) : (
            <span className="text-[10px] text-slate-400 font-medium">
              Ultimos {recentHistory.length} envios registrados.
            </span>
          )}
        </div>
      </div>

      {showAdminPresenceCard && (
        <section className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-4 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xs font-semibold text-slate-800">Usuários logados agora</h2>
              <p className="text-[11px] text-slate-500">
                Considera atividade recente nos últimos {activeUserPresence?.windowSeconds ?? 120}s.
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-semibold text-slate-900">{activeUserPresence?.totalUsers ?? 0}</div>
              <div className="text-[10px] text-slate-400">
                {activeUserPresence?.totalSessions ?? 0} sessão(ões)
              </div>
            </div>
          </div>

          {!activeUserPresence || activeUserPresence.users.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-[11px] text-slate-500">
              Nenhum usuário ativo no momento.
            </div>
          ) : (
            <div className="space-y-2">
              {activeUserPresence.users.map((user) => (
                <div
                  key={user.userId}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-slate-900">{user.name}</div>
                    <div className="truncate text-[11px] text-slate-500">{user.email}</div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-[11px] font-medium text-emerald-700">
                      {pageLabelMap[user.currentPage || ''] || 'Ativo no sistema'}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Último ping: {new Date(user.lastSeenAt).toLocaleTimeString('pt-BR')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Status do Maturador (Laboratório) */}
      {warmerPairs && warmerPairs.length > 0 && (
        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col gap-3 transition-all hover:border-violet-100 group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-violet-500/10 text-violet-600 flex items-center justify-center text-lg">
                🧬
              </div>
              <div>
                <h2 className="text-xs font-semibold text-slate-800">Status da Maturação (Laboratório)</h2>
                <p className="text-[11px] text-slate-500">Aquecimento preventivo de chips via IA Gemini.</p>
              </div>
            </div>
            <button 
              onClick={onNavigateToWarmer}
              className="text-[10px] font-bold text-violet-600 bg-violet-50 px-3 py-1.5 rounded-xl hover:bg-violet-100 transition-colors"
            >
              Ver Detalhes 🧬
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {warmerPairs.slice(0, 3).map((pair: any) => (
              <div key={pair.id} className="rounded-xl border border-slate-100 bg-slate-50/50 p-2.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${pair.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                    <span className="text-[11px] font-bold text-slate-800 truncate">{pair.name || `${pair.instance_a_id} ↔ ${pair.instance_b_id}`}</span>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {pair.sent_today > 0 ? `${pair.sent_today} msg hoje` : 'Nenhuma msg hoje'}
                  </div>
                </div>
                <div className="text-right shrink-0">
                   <div className={`text-[9px] font-bold px-1.5 py-0.5 rounded-lg inline-block uppercase tracking-wider ${
                     pair.last_run_status_actual === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                     pair.last_run_status_actual === 'failed' ? 'bg-rose-100 text-rose-700' :
                     'bg-slate-200 text-slate-600'
                   }`}>
                     {pair.last_run_status_actual || 'INATIVO'}
                   </div>
                   <div className="text-[8px] text-slate-400 mt-0.5">
                     {pair.last_run_finished_at ? new Date(pair.last_run_finished_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '-'}
                   </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Historico global de disparos */}
      <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-semibold text-slate-800">Historico de disparos</h2>
            <p className="text-[11px] text-slate-500">
              Ultimos envios de campanhas via webhooks.
            </p>
          </div>
        </div>

        {sendHistory.length === 0 ? (
          <p className="text-[11px] text-slate-400 mt-1">
            Nenhum disparo registrado ainda.
          </p>
        ) : (
          <ul className="mt-1 space-y-1.5 text-[11px] text-slate-700">
            {sendHistory.slice(0, 5).map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-2 py-1.5 gap-2"
              >
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold border shadow-sm ${item.ok
                        ? 'bg-emerald-500/10 text-emerald-700 border-emerald-200/50 shadow-emerald-600/5'
                        : 'bg-rose-500/10 text-rose-700 border-rose-200/50 shadow-rose-600/5'
                        }`}
                    >
                      {item.ok ? 'OK' : 'ERRO'}
                    </span>
                    <span className="font-medium text-slate-800 truncate max-w-[220px]">
                      {item.campaignName}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 truncate max-w-[260px]">
                    {item.ok
                      ? `HTTP ${item.status || 200}`
                      : `HTTP ${item.status || (item.errorCount > 0 ? 500 : 0)}`}
                    - {item.errorCount}/{item.total} contatos com erro - {item.runAt}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Blocos principais: campanhas, contatos/listas, envio/log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Campanhas */}
        <div className="bg-white rounded-xl border border-slate-200 p-3 flex flex-col gap-2 lg:col-span-2">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h2 className="text-xs font-semibold text-slate-700">Campanhas</h2>
              <p className="text-[11px] text-slate-400">Resumo rapido das ultimas campanhas.</p>
            </div>
            <button
              type="button"
              className="px-3 py-1.5 rounded-md text-[11px] font-medium bg-emerald-500 text-white hover:bg-emerald-400"
              onClick={onCreateCampaign}
            >
              Nova campanha
            </button>
          </div>

          {campaigns.length === 0 ? (
            <p className="text-[11px] text-slate-400">
              Nenhuma campanha cadastrada ainda. Crie a primeira para comecar a enviar mensagens.
            </p>
          ) : (
            <div className="space-y-1.5">
              {campaigns.slice(0, 5).map((camp) => (
                <div
                  key={camp.id}
                  className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-2 py-1.5"
                >
                  <div className="flex flex-col">
                    <span className="text-[11px] font-medium text-slate-800 truncate max-w-[220px]">
                      {camp.name}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      {(() => {
                        const log = campaignSendLog[camp.id]
                        if (log) {
                          return `Ultimo envio: ${log.lastOk ? 'OK' : `Erro ${log.lastErrorCount > 0 ? 500 : 0}`
                            } - ${log.lastRunAt}`
                        }

                        const historyForCamp = sendHistory.filter(
                          (h) => h.campaignId === camp.id,
                        )
                        if (historyForCamp.length > 0) {
                          const total = historyForCamp.reduce((acc, h) => acc + h.total, 0)
                          const errors = historyForCamp.reduce(
                            (acc, h) => acc + h.errorCount,
                            0,
                          )
                          const successes = total - errors
                          return `Historico: ${successes} sucesso(s), ${errors} erro(s), total ${total}`
                        }

                        return 'Nenhum disparo registrado para esta campanha.'
                      })()}
                    </span>
                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                      <span className="inline-flex items-center gap-1">
                        {camp.channels.includes('whatsapp') && (
                          <span className="px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-[9px]">
                            WhatsApp
                          </span>
                        )}
                        {camp.channels.includes('email') && (
                          <span className="px-1.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-100 text-[9px]">
                            Email
                          </span>
                        )}
                      </span>
                      <span className="text-slate-400">-</span>
                      <span>{camp.listName}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[9px] border ${camp.status === 'enviada'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        : camp.status === 'enviada_com_erros'
                          ? 'bg-amber-50 text-amber-700 border-amber-100'
                          : camp.status === 'agendada'
                            ? 'bg-sky-50 text-sky-700 border-sky-100'
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                    >
                      {camp.status === 'enviada'
                        ? 'Enviada'
                        : camp.status === 'enviada_com_erros'
                          ? 'Enviada com erros'
                          : camp.status === 'agendada'
                            ? 'Agendada'
                            : 'Rascunho'}
                    </span>
                    <button
                      type="button"
                      className="px-2 py-0.5 rounded-md border border-slate-200 text-[10px] text-slate-600 hover:bg-slate-50"
                      onClick={() => onEditCampaign(camp)}
                    >
                      Editar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Contatos & listas / canais */}
        <div className="space-y-3">
          <div className="bg-white rounded-xl border border-slate-200 p-3 flex flex-col gap-2">
            <h2 className="text-xs font-semibold text-slate-700">Contatos e listas</h2>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Contatos com WhatsApp</span>
                <span className="font-semibold text-slate-800">
                  {contacts.filter((c) => c.phone && c.phone.trim().length > 0).length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Contatos com Email</span>
                <span className="font-semibold text-slate-800">
                  {contacts.filter((c) => c.email && c.email.trim().length > 0).length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Listas sem contato</span>
                <span className="font-semibold text-slate-800">
                  {(contactsByList['sem-contatos'] ?? []).length}
                </span>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              <button
                type="button"
                className="px-2.5 py-1 rounded-md border border-slate-200 text-[11px] text-slate-600 hover:bg-slate-50"
                onClick={() => onNavigate('contacts')}
              >
                Ver contatos
              </button>
              <button
                type="button"
                className="px-2.5 py-1 rounded-md border border-slate-200 text-[11px] text-slate-600 hover:bg-slate-50"
                onClick={() => {
                  onNavigate('contacts')
                  const input = document.querySelector<HTMLInputElement>(
                    'input[type="file"][accept=".csv,text/csv"]',
                  )
                  input?.click()
                }}
              >
                Importar CSV
              </button>
            </div>
          </div>

          {/* Status de envio / integracoes */}
          <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 rounded-2xl p-3 flex flex-col gap-2 text-slate-100 shadow-lg shadow-slate-950/60">
            <h2 className="text-xs font-semibold">Envio e integracoes</h2>
            {sendingCampaignId ? (
              <div className="text-[11px] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-200">
                    Envio em andamento:
                    <span className="font-semibold ml-1">
                      {campaigns.find((c) => c.id === sendingCampaignId)?.name || 'Campanha'}
                    </span>
                  </span>
                  <span className="text-slate-300">
                    {sendingCurrentIndex} / {sendingTotal}
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 transition-all duration-300"
                    style={{
                      width:
                        sendingTotal > 0
                          ? `${Math.min(
                            100,
                            Math.max(0, (sendingCurrentIndex / sendingTotal) * 100),
                          )}%`
                          : '0%',
                    }}
                  />
                </div>
                {sendingErrors > 0 && (
                  <p className="text-[10px] text-amber-200">
                    {sendingErrors} contato(s) retornaram erro durante o envio.
                  </p>
                )}
              </div>
            ) : (
              <p className="text-[11px] text-slate-300">
                Nenhum envio em andamento no momento.
              </p>
            )}

            <div className="mt-2 border-t border-slate-800 pt-2 text-[10px] space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-300">Evolution API (WhatsApp)</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-full border text-[9px] font-medium ${hasEvolutionConfigured
                      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-400/40'
                      : 'bg-amber-500/10 text-amber-200 border-amber-400/40'
                      }`}
                  >
                    {hasEvolutionConfigured ? 'Ativo' : 'Nao configurado'}
                  </span>
                </div>
                <span className="max-w-[150px] truncate text-slate-200 text-[9px] text-right">
                  {hasEvolutionConfigured ? 'Configurado' : '-'}
                </span>
              </div>
              <button
                type="button"
                className="mt-1 px-2.5 py-1 rounded-md border border-slate-700 text-[10px] text-slate-100 hover:bg-slate-800/80"
                onClick={() => onNavigate('settings')}
              >
                Abrir configuracoes
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Atividades recentes */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mt-1">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-xs font-semibold text-slate-800">Atividades recentes</h2>
            <p className="text-[11px] text-slate-500">
              Ultimas campanhas criadas ou atualizadas no sistema.
            </p>
          </div>
        </div>
        {campaigns.length === 0 ? (
          <p className="text-[11px] text-slate-400">
            Nenhuma atividade registrada ainda.
          </p>
        ) : (
          <ol className="mt-1 space-y-1.5 text-[11px]">
            {campaigns.slice(0, 6).map((camp) => (
              <li
                key={`activity-${camp.id}`}
                className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-2 py-1.5"
              >
                <div className="flex flex-col">
                  <span className="font-medium text-slate-800 truncate max-w-[260px]">
                    {camp.name}
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant={
                      camp.status === 'enviada' ? 'success' :
                        camp.status === 'enviada_com_erros' ? 'warning' :
                          camp.status === 'agendada' ? 'info' : 'secondary'
                    }>
                      {camp.status === 'enviada'
                        ? 'Enviada'
                        : camp.status === 'enviada_com_erros'
                          ? 'Com Erros'
                          : camp.status === 'agendada'
                            ? 'Agendada'
                            : 'Rascunho'}
                    </Badge>
                    <span className="text-slate-400">·</span>
                    <span className="text-[10px] text-slate-500">
                      {camp.channels.includes('whatsapp') && 'WhatsApp'}
                      {camp.channels.includes('whatsapp') && camp.channels.includes('email') && ' · '}
                      {camp.channels.includes('email') && 'Email'}
                    </span>
                    {camp.createdAt && (
                      <>
                        <span className="text-slate-400">·</span>
                        <span className="text-[10px] text-slate-500">{camp.createdAt}</span>
                      </>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  className="px-2 py-0.5 rounded-md border border-slate-200 text-[10px] text-slate-600 hover:bg-slate-50"
                  onClick={() => onEditCampaign(camp)}
                >
                  Abrir
                </button>
              </li>
            ))}
          </ol>
        )}
      </section>
    </>
  )
}
