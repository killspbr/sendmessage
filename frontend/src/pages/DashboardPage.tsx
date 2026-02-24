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

  // Handlers
  onNavigate: (page: 'dashboard' | 'contacts' | 'campaigns' | 'settings') => void
  onCreateCampaign: () => void
  onEditCampaign: (campaign: Campaign) => void
  // Permissões (opcional)
  can?: (code: string) => boolean
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
  onNavigate,
  onCreateCampaign,
  onEditCampaign,
  can,
}: DashboardPageProps) {
  const canViewDashboard = !can || can('dashboard.view')

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
      {/* KPIs principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3 flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500">Total de contatos</span>
            <span className="h-6 w-6 rounded-lg bg-violet-500/10 text-violet-600 flex items-center justify-center text-[12px]" aria-hidden="true">
              👥
            </span>
          </div>
          <span className="text-2xl font-semibold text-slate-900">
            {Object.values(contactsByList).reduce((acc, list) => acc + list.length, 0)}
          </span>
          <span className="text-[10px] text-slate-400">Em todas as listas</span>
        </div>
        <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-3 flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500">Lista atual</span>
            <span className="h-6 w-6 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-[12px]" aria-hidden="true">
              📌
            </span>
          </div>
          <span className="text-2xl font-semibold text-slate-900">{contacts.length}</span>
          <span className="text-[11px] text-emerald-600">
            {lists.find((l) => l.id === currentListId)?.name}
          </span>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3 flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500">Listas de contatos</span>
            <span className="h-6 w-6 rounded-lg bg-sky-500/10 text-sky-600 flex items-center justify-center text-[12px]" aria-hidden="true">
              📂
            </span>
          </div>
          <span className="text-2xl font-semibold text-slate-900">{lists.length}</span>
          <span className="text-[10px] text-slate-400">Inclui lista padrão e personalizadas</span>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3 flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500">Campanhas cadastradas</span>
            <span className="h-6 w-6 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center text-[12px]" aria-hidden="true">
              📣
            </span>
          </div>
          <span className="text-2xl font-semibold text-slate-900">{campaigns.length}</span>
          <span className="text-[10px] text-slate-400">
            {campaigns.filter((c) => c.status === 'agendada').length} agendadas ·{' '}
            {campaigns.filter((c) => c.status === 'enviada').length} enviadas
          </span>
        </div>
        <div
          className={`bg-white rounded-2xl border shadow-sm p-3 flex flex-col gap-1 ${recentSuccessRate == null
            ? 'border-slate-100'
            : recentSuccessRate >= 90
              ? 'border-emerald-200'
              : recentSuccessRate >= 70
                ? 'border-amber-200'
                : 'border-rose-200'
            }`}
        >
          <div className="flex items-center justify-between">
            <span
              className="text-[11px] text-slate-500"
              title="Calculado com base nos últimos 10 registros de envio: percentual de envios com status OK em relação ao total (OK ÷ total)."
            >
              Qualidade dos envios recentes
            </span>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${recentSuccessRate == null
                ? 'bg-slate-500/10 text-slate-600'
                : recentSuccessRate >= 90
                  ? 'bg-emerald-500/10 text-emerald-700'
                  : recentSuccessRate >= 70
                    ? 'bg-amber-500/10 text-amber-700'
                    : 'bg-rose-500/10 text-rose-700'
                }`}
            >
              {recentSuccessRate == null
                ? 'Sem dados'
                : `${recentQualityLabel} · ${Math.round(recentSuccessRate)}% OK`}
            </span>
          </div>
          {recentSuccessRate == null ? (
            <span className="text-[10px] text-slate-400">Nenhum disparo registrado ainda.</span>
          ) : (
            <span className="text-[10px] text-slate-400">
              Considerando até os últimos {recentHistory.length} disparos: {recentTotals.total} contato(s),{' '}
              {recentTotals.errors} com erro.
            </span>
          )}
        </div>
      </div>

      {/* Histórico global de disparos */}
      <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-semibold text-slate-800">Histórico de disparos</h2>
            <p className="text-[11px] text-slate-500">
              Últimos envios de campanhas via webhooks.
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
                      className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-medium border ${item.ok
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        : 'bg-rose-50 text-rose-700 border-rose-100'
                        }`}
                    >
                      {item.ok ? 'OK' : 'Erro'}
                    </span>
                    <span className="font-medium text-slate-800 truncate max-w-[220px]">
                      {item.campaignName}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 truncate max-w-[260px]">
                    {item.ok
                      ? `HTTP ${item.status || 200}`
                      : `HTTP ${item.status || (item.errorCount > 0 ? 500 : 0)}`}
                    · {item.errorCount}/{item.total} contatos com erro · {item.runAt}
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
              <p className="text-[11px] text-slate-400">Resumo rápido das últimas campanhas.</p>
            </div>
            <button
              type="button"
              className="px-3 py-1.5 rounded-md text-[11px] font-medium bg-violet-500 text-white hover:bg-violet-400"
              onClick={onCreateCampaign}
            >
              Nova campanha
            </button>
          </div>

          {campaigns.length === 0 ? (
            <p className="text-[11px] text-slate-400">
              Nenhuma campanha cadastrada ainda. Crie a primeira para começar a enviar mensagens.
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
                          return `Último envio: ${log.lastOk ? 'OK' : `Erro ${log.lastErrorCount > 0 ? 500 : 0}`
                            } · ${log.lastRunAt}`
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
                          return `Histórico: ${successes} sucesso(s), ${errors} erro(s), total ${total}`
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
                      <span className="text-slate-400">·</span>
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

          {/* Status de envio / integrações */}
          <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 rounded-2xl p-3 flex flex-col gap-2 text-slate-100 shadow-lg shadow-slate-950/60">
            <h2 className="text-xs font-semibold">Envio e integrações</h2>
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
                    {hasEvolutionConfigured ? 'Ativo' : 'Não configurado'}
                  </span>
                </div>
                <span className="max-w-[150px] truncate text-slate-200 text-[9px] text-right">
                  {hasEvolutionConfigured ? 'Configurado' : '—'}
                </span>
              </div>
              <button
                type="button"
                className="mt-1 px-2.5 py-1 rounded-md border border-slate-700 text-[10px] text-slate-100 hover:bg-slate-800/80"
                onClick={() => onNavigate('settings')}
              >
                Abrir configurações
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
              Últimas campanhas criadas ou atualizadas no sistema.
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
                  <span className="text-[10px] text-slate-500 flex items-center gap-1">
                    <span>
                      {camp.status === 'enviada'
                        ? 'Campanha enviada'
                        : camp.status === 'enviada_com_erros'
                          ? 'Campanha enviada com erros'
                          : camp.status === 'agendada'
                            ? 'Campanha agendada'
                            : 'Rascunho de campanha'}
                    </span>
                    <span className="text-slate-400">·</span>
                    <span>
                      {camp.channels.includes('whatsapp') && 'WhatsApp'}
                      {camp.channels.includes('whatsapp') && camp.channels.includes('email') && ' · '}
                      {camp.channels.includes('email') && 'Email'}
                    </span>
                    {camp.createdAt && (
                      <>
                        <span className="text-slate-400">·</span>
                        <span>{camp.createdAt}</span>
                      </>
                    )}
                  </span>
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
