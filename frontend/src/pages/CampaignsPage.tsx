import { useState, useEffect } from 'react'
import { CampaignEditor } from '../components/campaigns/CampaignEditor'
import { CampaignDeliveryComposer } from '../components/campaigns/CampaignDeliveryComposer'
import type { Campaign, CampaignChannel, CampaignMediaItem, CampaignSharedContact, ContactList, Contact, SendHistoryItem, ContactSendHistoryItem, CampaignSendLog } from '../types'

type CampaignsPageProps = {
  // Dados
  campaigns: Campaign[]
  lists: ContactList[]
  sortedLists: ContactList[]
  contactsByList: Record<string, Contact[]>
  sendHistory: SendHistoryItem[]
  contactSendHistory: ContactSendHistoryItem[]
  campaignSendLog: Record<string, CampaignSendLog>

  // Estado do editor
  campaignEditorOpen: boolean
  editingCampaignId: string | null
  newCampaignName: string
  newCampaignListId: string
  newCampaignChannels: CampaignChannel[]
  newCampaignMessage: string
  newCampaignMediaItems: CampaignMediaItem[]
  newCampaignSharedContact: CampaignSharedContact | null

  // Estado de envio
  sendingCampaignId: string | null
  sendingCurrentIndex: number
  sendingTotal: number
  sendingErrors: number
  sendingNextDelaySeconds: number | null
  sendConfirmCampaignId: string | null

  // Configurações
  hasEvolutionConfigured: boolean
  sendIntervalMinSeconds: number
  sendIntervalMaxSeconds: number
  onChangeSendIntervalMinSeconds: (value: number) => void
  onChangeSendIntervalMaxSeconds: (value: number) => void

  // Estado do relatório
  reportCampaignId: string | null
  reportViewMode: 'all' | 'last'

  // Handlers do editor
  onSetCampaignEditorOpen: (open: boolean) => void
  onSetEditingCampaignId: (id: string | null) => void
  onSetNewCampaignName: (name: string) => void
  onSetNewCampaignListId: (id: string) => void
  onSetNewCampaignChannels: (channels: CampaignChannel[]) => void
  onSetNewCampaignMessage: (message: string) => void
  onSetNewCampaignMediaItems: (items: CampaignMediaItem[]) => void
  onSetNewCampaignSharedContact: (contact: CampaignSharedContact | null) => void

  // Handlers de ações
  onCreateCampaign: () => void
  onCancelEditCampaign: () => void
  onStartEditCampaign: (campaign: Campaign) => void
  onDuplicateCampaign: (campaign: Campaign) => void
  onDeleteCampaign: (id: string) => void
  onRequestSendCampaign: (campaign: Campaign) => void
  onSendCampaign: (campaign: Campaign) => void
  onContinueCampaign: (campaign: Campaign) => void
  onSetSendConfirmCampaignId: (id: string | null) => void
  onScheduleCampaign: (id: string, config: any) => Promise<void>

  // Handlers do relatório
  onSetReportCampaignId: (id: string | null) => void
  onSetReportViewMode: (mode: 'all' | 'last') => void

  // Funções utilitárias
  htmlToWhatsapp: (html: string) => string
  htmlToText: (html: string) => string
  getPendingContacts: (campaign: Campaign) => { pendingContacts: Contact[], contactsForList: Contact[] }
  // Permissões (opcional)
  can?: (code: string) => boolean
  currentUserGroupName?: string | null

  // IA (opcional)
  geminiApiKey?: string
  userHasConfiguredAi?: boolean
  onGenerateCampaignContentWithAI?: (options: {
    mode: 'suggest' | 'rewrite'
    currentContent: string
    campaignName: string
    listName: string
    channels: CampaignChannel[]
    tone?: 'neutral' | 'friendly' | 'sales' | 'educational'
    goal?: 'leads' | 'direct_sale' | 'engagement' | 'reactivation'
    campaignType?: 'first_contact' | 'follow_up' | 'recovery'
    segment?: string
    useEmojis?: boolean
    messageSize?: 'short' | 'medium' | 'long'
  }) => Promise<string | null>
}

function getLocalDateInputValue(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getHistoryTime(entry: ContactSendHistoryItem) {
  const time = entry.runAtIso ? new Date(entry.runAtIso).getTime() : new Date(entry.runAt).getTime()
  return Number.isNaN(time) ? 0 : time
}

function getDeliveryStatusMeta(entry: ContactSendHistoryItem) {
  if (entry.status === 207 || entry.providerStatus === 'partial') {
    return {
      label: 'Parcial',
      className: 'bg-amber-500/10 text-amber-700 border border-amber-200/50 shadow-sm shadow-amber-600/10 px-2 py-0.5 rounded-full',
      title: entry.errorDetail || 'O envio principal saiu, mas houve falha em parte da entrega composta.',
    }
  }

  if (entry.ok) {
    return {
      label: 'Enviado',
      className: 'bg-emerald-500/10 text-emerald-700 border border-emerald-200/50 shadow-sm shadow-emerald-600/10 px-2 py-0.5 rounded-full',
      title: 'Entrega concluída sem erros registrados.',
    }
  }

  return {
    label: 'Erro',
    className: 'bg-rose-500/10 text-rose-700 border border-rose-200/50 shadow-sm shadow-rose-600/10 px-2 py-0.5 rounded-full',
    title: entry.errorDetail || 'Falha no envio.',
  }
}

function buildDeliveryDetailParts(entry: ContactSendHistoryItem) {
  const summary = entry.deliverySummary
  if (!summary) return []

  const parts: string[] = []
  if (summary.sentText) parts.push('Texto')
  if (summary.mediaSent > 0) parts.push(`Mídia ${summary.mediaSent}`)
  if (summary.mediaFailed > 0) parts.push(`Falha mídia ${summary.mediaFailed}`)
  if (summary.contactSent) parts.push('Contato')
  if (summary.contactFailed) parts.push('Falha contato')
  return parts
}

export function CampaignsPage({
  campaigns,
  lists,
  sortedLists,
  contactsByList,
  sendHistory,
  contactSendHistory,
  campaignSendLog,
  campaignEditorOpen,
  editingCampaignId,
  newCampaignName,
  newCampaignListId,
  newCampaignChannels,
  newCampaignMessage,
  newCampaignMediaItems,
  newCampaignSharedContact,
  sendingCampaignId,
  sendingCurrentIndex,
  sendingTotal,
  sendingErrors,
  sendingNextDelaySeconds,
  sendConfirmCampaignId,
  hasEvolutionConfigured,
  sendIntervalMinSeconds,
  sendIntervalMaxSeconds,
  onChangeSendIntervalMinSeconds,
  onChangeSendIntervalMaxSeconds,
  reportCampaignId,
  reportViewMode,
  onSetCampaignEditorOpen,
  onSetEditingCampaignId,
  onSetNewCampaignName,
  onSetNewCampaignListId,
  onSetNewCampaignChannels,
  onSetNewCampaignMessage,
  onSetNewCampaignMediaItems,
  onSetNewCampaignSharedContact,
  onCreateCampaign,
  onCancelEditCampaign,
  onStartEditCampaign,
  onDuplicateCampaign,
  onDeleteCampaign,
  onRequestSendCampaign,
  onSendCampaign,
  onContinueCampaign,
  onSetSendConfirmCampaignId,
  onSetReportCampaignId,
  onSetReportViewMode,
  htmlToWhatsapp,
  htmlToText,
  getPendingContacts,
  can,
  currentUserGroupName,
  geminiApiKey,
  userHasConfiguredAi,
  onGenerateCampaignContentWithAI,
  onScheduleCampaign,
}: CampaignsPageProps) {
  const canViewCampaigns = !can || can('campaigns.view')

  const [aiLoading, setAiLoading] = useState<'suggest' | 'rewrite' | null>(null)
  const [aiTone, setAiTone] = useState<'neutral' | 'friendly' | 'sales' | 'educational'>('friendly')
  const [aiGoal, setAiGoal] = useState<'leads' | 'direct_sale' | 'engagement' | 'reactivation'>('leads')
  const [aiCampaignType, setAiCampaignType] = useState<'first_contact' | 'follow_up' | 'recovery'>('first_contact')
  const [aiSegment, setAiSegment] = useState<string>('Genérico')
  const [aiSegmentOther, setAiSegmentOther] = useState<string>('')
  const [aiUseEmojis, setAiUseEmojis] = useState<boolean>(true)
  const [aiMessageSize, setAiMessageSize] = useState<'short' | 'medium' | 'long'>('medium')

  // Estado para Agendamento Profissional
  const now = new Date()
  const [showScheduleModal, setShowScheduleModal] = useState<string | null>(null)
  const [scheduleError, setScheduleError] = useState<string | null>(null)
  const [schedConfig, setSchedConfig] = useState({
    data_inicio: getLocalDateInputValue(now),
    hora_inicio: now.toTimeString().slice(0, 5),
    intervalo_minimo: 30,
    intervalo_maximo: 90,
    mensagens_por_lote: 40,
    tempo_pausa_lote: 10,
    limite_diario: 150,
  })

  const canCreateCampaign = !can || can('campaigns.create')
  const canEditCampaign = !can || can('campaigns.edit')
  const canDeleteCampaign = !can || can('campaigns.delete')
  const canSendCampaign = !can || can('campaigns.send')

  const ROLE_ORDER = ['Administrador', 'Gerente', 'Operador', 'Visualizador'] as const
  const currentRoleIndex = currentUserGroupName ? ROLE_ORDER.indexOf(currentUserGroupName as any) : -1
  const canEditInterval = currentRoleIndex >= 0 && currentRoleIndex <= ROLE_ORDER.indexOf('Operador')

  // Botões de IA ficam sempre habilitados na UI; a validação real da chave
  // é feita na função callGeminiForCampaign no App.tsx (que exibe mensagem adequada).
  const iaDisponivel = true
  const iaTooltip = geminiApiKey
    ? undefined
    : 'Se a IA não funcionar, verifique se há API própria em "Meu perfil" ou peça ao administrador para cadastrar chaves no pool global em "APIs Gemini".'

  const openScheduleModal = (campaignId: string) => {
    const nextNow = new Date()
    setSchedConfig((prev) => ({
      ...prev,
      data_inicio: prev.data_inicio || getLocalDateInputValue(nextNow),
      hora_inicio: prev.hora_inicio || nextNow.toTimeString().slice(0, 5),
    }))
    setScheduleError(null)
    setShowScheduleModal(campaignId)
  }

  const handleConfirmSchedule = async () => {
    const campId = showScheduleModal
    if (!campId) return
    if (schedConfig.intervalo_minimo <= 0 || schedConfig.intervalo_maximo <= 0) {
      setScheduleError('Os intervalos devem ser maiores que zero.')
      return
    }
    if (schedConfig.intervalo_minimo > schedConfig.intervalo_maximo) {
      setScheduleError('O intervalo mínimo não pode ser maior que o máximo.')
      return
    }
    if (schedConfig.mensagens_por_lote <= 0 || schedConfig.tempo_pausa_lote < 0 || schedConfig.limite_diario <= 0) {
      setScheduleError('Revise lote, pausa e limite diário antes de agendar.')
      return
    }
    setScheduleError(null)
    setShowScheduleModal(null)
    await onScheduleCampaign(campId, schedConfig)
  }

  if (!canViewCampaigns) {
    return (
      <section className="bg-white rounded-2xl border border-slate-200 shadow-md p-4 md:p-5">
        <p className="text-[12px] md:text-[13px] text-slate-500">
          Você não tem permissão para visualizar as campanhas.
        </p>
      </section>
    )
  }
  return (
    <>
      <section className="bg-white rounded-2xl border border-slate-200 shadow-md p-4 md:p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">Campanhas</h2>
            <p className="text-[11px] text-slate-500">Organize e acompanhe seus envios.</p>
          </div>
          {!campaignEditorOpen && canCreateCampaign && (
            <button
              className="px-3 py-1.5 rounded-md text-xs font-medium bg-emerald-500 text-white hover:bg-emerald-400 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => {
                onSetEditingCampaignId(null)
                onSetNewCampaignName('')
                onSetNewCampaignListId(sortedLists[0]?.id || '')
                onSetNewCampaignChannels(['whatsapp'])
                onSetNewCampaignMessage('')
                onSetNewCampaignMediaItems([])
                onSetNewCampaignSharedContact(null)
                onSetCampaignEditorOpen(true)
              }}
              disabled={!canCreateCampaign}
            >
              Criar campanha
            </button>
          )}
        </div>

        {campaignEditorOpen && (
          <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 flex flex-col gap-3 mt-1">
            <div className="flex flex-col md:flex-row flex-wrap gap-3 md:items-end">
              <div className="flex flex-col gap-1 w-full md:w-auto">
                <label htmlFor="new-campaign-name" className="text-[10px] font-medium text-slate-600">
                  {editingCampaignId ? 'Editar campanha' : 'Nome da campanha'}
                </label>
                <input
                  id="new-campaign-name"
                  type="text"
                  value={newCampaignName}
                  onChange={(e) => onSetNewCampaignName(e.target.value)}
                  placeholder="Ex: Campanha WhatsApp Pizzarias"
                  className="h-8 w-full md:w-64 px-2 rounded-md border border-slate-200 bg-white text-[11px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-400/80"
                />
              </div>
              <div className="flex flex-col gap-1 w-full md:w-auto">
                <label className="text-[10px] font-medium text-slate-600">Lista</label>
                <select
                  value={newCampaignListId}
                  onChange={(e) => onSetNewCampaignListId(e.target.value)}
                  className="h-8 w-full md:w-44 px-2 rounded-md border border-slate-200 bg-white text-[11px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-400/80"
                >
                  {sortedLists.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-medium text-slate-600">Canais</label>
                <div className="flex items-center gap-3 h-8">
                  <label className="inline-flex items-center gap-1 text-[11px] text-slate-700">
                    <input
                      type="checkbox"
                      className="h-3 w-3"
                      checked={newCampaignChannels.includes('whatsapp')}
                      onChange={(e) => {
                        onSetNewCampaignChannels(
                          e.target.checked
                            ? [...newCampaignChannels, 'whatsapp']
                            : newCampaignChannels.filter((ch) => ch !== 'whatsapp'),
                        )
                      }}
                    />
                    <span>WhatsApp</span>
                  </label>
                  <label className="inline-flex items-center gap-1 text-[11px] text-slate-700">
                    <input
                      type="checkbox"
                      className="h-3 w-3"
                      checked={newCampaignChannels.includes('email')}
                      onChange={(e) => {
                        onSetNewCampaignChannels(
                          e.target.checked
                            ? [...newCampaignChannels, 'email']
                            : newCampaignChannels.filter((ch) => ch !== 'email'),
                        )
                      }}
                    />
                    <span>Email</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1 mt-1">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-medium text-slate-600">Conteúdo da campanha</label>

                {onGenerateCampaignContentWithAI && (
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex flex-wrap items-center justify-end gap-1">
                      <div className="flex items-center gap-1 bg-slate-100 rounded-full px-2 py-0.5" title="Define como a mensagem deve soar para o contato.">
                        <span className="text-[9px] text-slate-500">Tom:</span>
                        <button
                          type="button"
                          className={`px-1.5 py-0.5 rounded-full text-[9px] border ${aiTone === 'neutral'
                            ? 'bg-white text-slate-800 border-slate-400'
                            : 'text-slate-500 border-transparent'
                            }`}
                          title="Texto equilibrado, sem apelo de vendas forte."
                          onClick={() => setAiTone('neutral')}
                        >
                          Neutro
                        </button>
                        <button
                          type="button"
                          className={`px-1.5 py-0.5 rounded-full text-[9px] border ${aiTone === 'friendly'
                            ? 'bg-white text-slate-800 border-slate-400'
                            : 'text-slate-500 border-transparent'
                            }`}
                          title="Texto próximo e informal, mais acolhedor."
                          onClick={() => setAiTone('friendly')}
                        >
                          Amigável
                        </button>
                        <button
                          type="button"
                          className={`px-1.5 py-0.5 rounded-full text-[9px] border ${aiTone === 'sales'
                            ? 'bg-white text-slate-800 border-slate-400'
                            : 'text-slate-500 border-transparent'
                            }`}
                          title="Texto mais direto para venda, com foco em conversão."
                          onClick={() => setAiTone('sales')}
                        >
                          Vendas
                        </button>
                      </div>

                      <div className="flex items-center gap-1 bg-slate-100 rounded-full px-2 py-0.5" title="Contexto da abordagem em relação ao cliente.">
                        <span className="text-[9px] text-slate-500">Tipo:</span>
                        <button
                          type="button"
                          className={`px-1.5 py-0.5 rounded-full text-[9px] border ${aiCampaignType === 'first_contact'
                            ? 'bg-white text-slate-800 border-slate-400'
                            : 'text-slate-500 border-transparent'
                            }`}
                          title="Primeiro contato com a base dessa campanha."
                          onClick={() => setAiCampaignType('first_contact')}
                        >
                          1º contato
                        </button>
                        <button
                          type="button"
                          className={`px-1.5 py-0.5 rounded-full text-[9px] border ${aiCampaignType === 'follow_up'
                            ? 'bg-white text-slate-800 border-slate-400'
                            : 'text-slate-500 border-transparent'
                            }`}
                          title="Mensagem de acompanhamento após contato anterior."
                          onClick={() => setAiCampaignType('follow_up')}
                        >
                          Follow-up
                        </button>
                        <button
                          type="button"
                          className={`px-1.5 py-0.5 rounded-full text-[9px] border ${aiCampaignType === 'recovery'
                            ? 'bg-white text-slate-800 border-slate-400'
                            : 'text-slate-500 border-transparent'
                            }`}
                          title="Focado em recuperar clientes inativos ou perdidos."
                          onClick={() => setAiCampaignType('recovery')}
                        >
                          Recuperação
                        </button>
                      </div>

                      <div className="flex items-center gap-1 bg-slate-100 rounded-full px-2 py-0.5">
                        <span className="text-[9px] text-slate-500">Segmento:</span>
                        <select
                          value={aiSegment}
                          onChange={(e) => {
                            setAiSegment(e.target.value)
                            if (e.target.value !== 'Outro') setAiSegmentOther('')
                          }}
                          className="h-6 px-2 rounded-md border border-slate-200 bg-white text-[10px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-400/80"
                        >
                          <option value="Outro">Outro</option>
                          <option value="Academia / Crossfit">Academia / Crossfit</option>
                          <option value="Autoescola">Autoescola</option>
                          <option value="Barbearia">Barbearia</option>
                          <option value="Cafeteria">Cafeteria</option>
                          <option value="Clínica estética">Clínica estética</option>
                          <option value="Clínica médica">Clínica médica</option>
                          <option value="Clínica odontológica">Clínica odontológica</option>
                          <option value="Coworking / Escritório compartilhado">Coworking / Escritório compartilhado</option>
                          <option value="Corretor de imóveis">Corretor de imóveis</option>
                          <option value="Corretor de seguros">Corretor de seguros</option>
                          <option value="Cursos / Escola">Cursos / Escola</option>
                          <option value="E-commerce geral">E-commerce geral</option>
                          <option value="Escola de idiomas">Escola de idiomas</option>
                          <option value="Escola infantil">Escola infantil</option>
                          <option value="Escritório de advocacia">Escritório de advocacia</option>
                          <option value="Escritório de contabilidade">Escritório de contabilidade</option>
                          <option value="Eventos / Buffet">Eventos / Buffet</option>
                          <option value="Farmácia / Drogaria">Farmácia / Drogaria</option>
                          <option value="Genérico">Genérico</option>
                          <option value="Hamburgueria">Hamburgueria</option>
                          <option value="Hotel / Pousada">Hotel / Pousada</option>
                          <option value="Imobiliária">Imobiliária</option>
                          <option value="Lanchonete / Fast-food">Lanchonete / Fast-food</option>
                          <option value="Loja de acessórios">Loja de acessórios</option>
                          <option value="Loja de autopeças">Loja de autopeças</option>
                          <option value="Loja de calçados">Loja de calçados</option>
                          <option value="Loja de celulares">Loja de celulares</option>
                          <option value="Loja de cosméticos">Loja de cosméticos</option>
                          <option value="Loja de informática">Loja de informática</option>
                          <option value="Loja de móveis">Loja de móveis</option>
                          <option value="Loja de roupas">Loja de roupas</option>
                          <option value="Materiais de construção">Materiais de construção</option>
                          <option value="Mercado / Hortifruti">Mercado / Hortifruti</option>
                          <option value="NGO / Instituição social">ONG / Instituição social</option>
                          <option value="Oficina mecânica">Oficina mecânica</option>
                          <option value="Padaria / Confeitaria">Padaria / Confeitaria</option>
                          <option value="Papelaria / Utilidades">Papelaria / Utilidades</option>
                          <option value="Perfumaria">Perfumaria</option>
                          <option value="Pet shop">Pet shop</option>
                          <option value="Profissional liberal / consultor">Profissional liberal / consultor</option>
                          <option value="Restaurante / Pizzaria">Restaurante / Pizzaria</option>
                          <option value="Salão de beleza">Salão de beleza</option>
                          <option value="Saúde mental / psicologia">Saúde mental / psicologia</option>
                          <option value="Serviços financeiros / crédito">Serviços financeiros / crédito</option>
                          <option value="Turismo / Agência de viagens">Turismo / Agência de viagens</option>
                          <option value="Veterinária">Veterinária</option>
                          <option value="Estúdio de pilates / yoga">Estúdio de pilates / yoga</option>
                        </select>

                        {aiSegment === 'Outro' && (
                          <input
                            type="text"
                            value={aiSegmentOther}
                            onChange={(e) => setAiSegmentOther(e.target.value)}
                            placeholder="Descreva o segmento"
                            className="h-6 w-40 px-2 rounded-md border border-slate-200 bg-white text-[10px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-400/80"
                          />
                        )}
                      </div>

                      <div className="flex items-center gap-1 bg-slate-100 rounded-full px-2 py-0.5" title="Qual é o principal resultado esperado com essa campanha.">
                        <span className="text-[9px] text-slate-500">Objetivo:</span>
                        <button
                          type="button"
                          className={`px-1.5 py-0.5 rounded-full text-[9px] border ${aiGoal === 'leads'
                            ? 'bg-white text-slate-800 border-slate-400'
                            : 'text-slate-500 border-transparent'
                            }`}
                          title="Foco em gerar contatos interessados (leads)."
                          onClick={() => setAiGoal('leads')}
                        >
                          Leads
                        </button>
                        <button
                          type="button"
                          className={`px-1.5 py-0.5 rounded-full text-[9px] border ${aiGoal === 'direct_sale'
                            ? 'bg-white text-slate-800 border-slate-400'
                            : 'text-slate-500 border-transparent'
                            }`}
                          title="Foco em gerar vendas diretamente pela mensagem."
                          onClick={() => setAiGoal('direct_sale')}
                        >
                          Venda
                        </button>
                        <button
                          type="button"
                          className={`px-1.5 py-0.5 rounded-full text-[9px] border ${aiGoal === 'engagement'
                            ? 'bg-white text-slate-800 border-slate-400'
                            : 'text-slate-500 border-transparent'
                            }`}
                          title="Foco em respostas, cliques ou interação com a base."
                          onClick={() => setAiGoal('engagement')}
                        >
                          Engajamento
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 rounded-full bg-slate-100 p-1">
                        <button
                          type="button"
                          className={`px-2 py-1 rounded-full text-[9px] font-medium ${aiMessageSize === 'short' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}
                          title="Mensagem curta, ideal para abordagens rápidas."
                          onClick={() => setAiMessageSize('short')}
                        >
                          Curta
                        </button>
                        <button
                          type="button"
                          className={`px-2 py-1 rounded-full text-[9px] font-medium ${aiMessageSize === 'medium' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}
                          title="Mensagem equilibrada para contexto e conversão."
                          onClick={() => setAiMessageSize('medium')}
                        >
                          Média
                        </button>
                        <button
                          type="button"
                          className={`px-2 py-1 rounded-full text-[9px] font-medium ${aiMessageSize === 'long' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}
                          title="Mensagem mais desenvolvida, útil para email ou propostas consultivas."
                          onClick={() => setAiMessageSize('long')}
                        >
                          Longa
                        </button>
                      </div>

                      <label className="flex items-center gap-1 text-[9px] text-slate-600 select-none" title="Quando marcado, a IA pode incluir emojis nas mensagens geradas.">
                        <input
                          type="checkbox"
                          checked={aiUseEmojis}
                          onChange={(e) => setAiUseEmojis(e.target.checked)}
                          className="h-3 w-3 rounded border-slate-300 text-emerald-500 focus:ring-emerald-400"
                        />
                        <span>Usar emojis no texto</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              <CampaignEditor
                content={newCampaignMessage}
                onChange={onSetNewCampaignMessage}
                channels={newCampaignChannels}
                htmlToWhatsapp={htmlToWhatsapp}
                mediaItems={newCampaignMediaItems}
                sharedContact={newCampaignSharedContact}
                aiLoading={aiLoading}
                onGenerateAI={
                  onGenerateCampaignContentWithAI
                    ? async ({ mode }) => {
                        const list = lists.find((l) => l.id === newCampaignListId) ?? lists[0]
                        const listName = list?.name ?? newCampaignListId
                        const segmentLabel = aiSegment === 'Outro' && aiSegmentOther.trim() ? aiSegmentOther.trim() : aiSegment
                        setAiLoading(mode)
                        await onGenerateCampaignContentWithAI({
                          mode,
                          currentContent: newCampaignMessage,
                          campaignName: newCampaignName || 'Campanha sem nome',
                          listName,
                          channels: newCampaignChannels,
                          tone: aiTone,
                          goal: aiGoal,
                          campaignType: aiCampaignType,
                          segment: segmentLabel,
                          useEmojis: aiUseEmojis,
                          messageSize: aiMessageSize,
                        })
                        setAiLoading(null)
                      }
                    : undefined
                }
              />

              <CampaignDeliveryComposer
                channels={newCampaignChannels}
                mediaItems={newCampaignMediaItems}
                sharedContact={newCampaignSharedContact}
                onChangeMediaItems={onSetNewCampaignMediaItems}
                onChangeSharedContact={onSetNewCampaignSharedContact}
              />
            </div>

            {/* Removido blocos duplicados de pré-visualização que agora estão dentro do CampaignEditor */}

            <div className="flex items-center justify-between mt-1">
              <div className="flex flex-col gap-1 text-[10px] text-slate-500 mr-4">
                {canEditInterval ? (
                  <>
                    <span>Intervalo aleatório entre disparos (segundos).</span>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1">
                        <span>Mín:</span>
                        <input
                          type="number"
                          min={0}
                          value={sendIntervalMinSeconds}
                          onChange={(e) => {
                            const value = Number(e.target.value)
                            if (Number.isNaN(value) || value < 0) return
                            onChangeSendIntervalMinSeconds(value)
                            if (value > sendIntervalMaxSeconds) {
                              onChangeSendIntervalMaxSeconds(value)
                            }
                          }}
                          className="h-7 w-16 px-1 rounded-md border border-slate-200 bg-white text-[10px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-400/80"
                          title="Valor mínimo em segundos entre um contato e outro."
                        />
                      </label>
                      <label className="flex items-center gap-1">
                        <span>Máx:</span>
                        <input
                          type="number"
                          min={0}
                          value={sendIntervalMaxSeconds}
                          onChange={(e) => {
                            const value = Number(e.target.value)
                            if (Number.isNaN(value) || value < 0) return
                            // Ao editar o máximo, não alteramos o mínimo automaticamente
                            onChangeSendIntervalMaxSeconds(value)
                          }}
                          className="h-7 w-16 px-1 rounded-md border border-slate-200 bg-white text-[10px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-400/80"
                        />
                      </label>
                    </div>
                    <span className="text-[9px] text-slate-400">
                      Cada envio sorteia um valor entre o mínimo e o máximo para o próximo contato.
                    </span>
                  </>
                ) : (
                  <span>
                    As campanhas serão enviadas um contato por vez, com intervalo aleatório entre{' '}
                    <strong>{sendIntervalMinSeconds}s</strong> e <strong>{sendIntervalMaxSeconds}s</strong>.
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="h-8 px-3 rounded-md text-[11px] font-medium bg-emerald-500 text-white hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed"
                  onClick={onCreateCampaign}
                  disabled={
                    !newCampaignName.trim() ||
                    !newCampaignMessage.trim() ||
                    newCampaignChannels.length === 0 ||
                    // Para criar é necessário campaigns.create; para editar, campaigns.edit
                    (!editingCampaignId && !canCreateCampaign) ||
                    (!!editingCampaignId && !canEditCampaign)
                  }
                >
                  {editingCampaignId ? 'Salvar alterações' : 'Salvar campanha'}
                </button>
                <button
                  type="button"
                  className="h-8 px-3 rounded-md text-[11px] font-medium border border-slate-300 text-slate-600 hover:bg-slate-100"
                  onClick={onCancelEditCampaign}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {!campaignEditorOpen && (
          campaigns.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-6 flex flex-col items-center justify-center text-center gap-2 mt-3">
              <div className="h-10 w-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-lg">
                ✉️
              </div>
              <h3 className="text-sm font-semibold text-slate-800">Nenhuma campanha criada ainda</h3>
              <p className="text-[11px] text-slate-500 max-w-xs">
                Crie sua primeira campanha para disparar mensagens para uma lista de contatos vinda do n8n.
              </p>
            </div>
          ) : (
            <div className="space-y-3 mt-3">
              {/* Confirmação de envio */}
              {sendConfirmCampaignId && (() => {
                const campToSend = campaigns.find((c) => c.id === sendConfirmCampaignId)
                if (!campToSend) return null

                const listForCamp =
                  lists.find((l) => l.name === campToSend.listName) ?? lists[0]
                const listIdForCamp = listForCamp?.id ?? 'default'
                const contactsForCampList = contactsByList[listIdForCamp] ?? []
                const effectiveChannelsForCamp: CampaignChannel[] = campToSend.channels.filter((ch) =>
                  ch === 'whatsapp' ? hasEvolutionConfigured : false,
                )

                const min = campToSend.intervalMinSeconds ?? 30
                const max = campToSend.intervalMaxSeconds ?? 90

                return (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50/80 px-3 py-2 flex flex-col gap-2 text-[11px] text-emerald-900">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 flex flex-col gap-0.5">
                        <span className="font-semibold">
                          Confirmar disparo da campanha "{campToSend.name}"?
                        </span>
                        <span className="text-[10px] text-emerald-800">
                          Esta campanha será enviada para <strong>{contactsForCampList.length}</strong>{' '}
                          contato(s) em <strong>{effectiveChannelsForCamp.length}</strong> canal(is), um por vez, com
                          intervalo aleatório entre <strong>{min}s</strong> e <strong>{max}s</strong> por contato.
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        className="px-2.5 py-1 rounded-md border border-slate-200 bg-white text-[11px] text-slate-700 hover:bg-slate-50"
                        onClick={() => onSetSendConfirmCampaignId(null)}
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        className="px-2.5 py-1 rounded-md bg-emerald-600 text-[11px] text-white hover:bg-emerald-500"
                        onClick={() => {
                          onSetSendConfirmCampaignId(null)
                          onSendCampaign(campToSend)
                        }}
                      >
                        Confirmar disparo
                      </button>
                    </div>
                  </div>
                )
              })()}

              {sendingCampaignId && (() => {
                const sendingCamp = campaigns.find((c) => c.id === sendingCampaignId)
                const min = sendingCamp?.intervalMinSeconds ?? 30
                const max = sendingCamp?.intervalMaxSeconds ?? 90

                return (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 px-3 py-2 flex flex-col gap-1 text-[11px] text-emerald-900 shadow-sm shadow-emerald-600/5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">
                        Envio em andamento: {sendingCamp?.name || 'Campanha'}
                      </span>
                      <span className="text-[10px]">
                        {sendingCurrentIndex} de {sendingTotal} contatos
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-emerald-100 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 transition-all duration-300"
                        style={{
                          width: sendingTotal > 0 ? `${Math.min(100, (sendingCurrentIndex / sendingTotal) * 100)}%` : '0%',
                        }}
                      />
                    </div>
                    <div className="flex flex-col gap-0.5 text-[10px] mt-0.5">
                      <div className="flex items-center justify-between">
                        <span>
                          Intervalo automático: entre {min}s e {max}s por contato.
                        </span>
                        <span>Erros: {sendingErrors}</span>
                      </div>
                      {sendingNextDelaySeconds != null && sendingNextDelaySeconds > 0 && (
                        <div className="mt-1 font-bold text-emerald-700">
                           Próximo disparo em {sendingNextDelaySeconds}s...
                        </div>
                      )}
                    </div>
                  </div>
                )
              })()}

              <div className="grid gap-4">
                {campaigns.map((camp) => {
                  const log = campaignSendLog[camp.id]
                  const hasErrors = !!log && log.lastErrorCount > 0 && !log.lastOk
                  const isSending = sendingCampaignId === camp.id
                  const progressDone = isSending ? sendingCurrentIndex : 0
                  const progressTotal = isSending ? sendingTotal : 0
                  const progressPercent = progressTotal > 0 ? Math.round((progressDone / progressTotal) * 100) : 0

                  const { pendingContacts, contactsForList } = getPendingContacts(camp)
                  const totalContacts = contactsForList.length
                  const sentCount = totalContacts - pendingContacts.length
                  
                  return (
                    <article 
                      key={camp.id} 
                      className={`group relative overflow-hidden rounded-3xl border transition-all duration-300 hover:shadow-lg ${
                        isSending ? 'border-emerald-200 bg-emerald-50/30 ring-1 ring-emerald-500/20 shadow-emerald-500/5' : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div className="flex flex-col p-5">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="flex-1 space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              {(() => {
                                if (isSending) return <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                                if (camp.status === 'agendada') return <span className="flex h-2 w-2 rounded-full bg-sky-500" />
                                if (camp.status === 'enviada') return <span className="flex h-2 w-2 rounded-full bg-slate-300" />
                                return <span className="flex h-2 w-2 rounded-full bg-slate-200" />
                              })()}
                              <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                                {camp.name}
                              </h3>
                              
                              <div className="flex flex-wrap gap-1.5">
                                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                  {camp.listName} • {totalContacts} contatos
                                </span>
                                {camp.channels.map((ch) => (
                                  <span key={ch} className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                    ch === 'whatsapp' ? 'bg-emerald-100 text-emerald-700' : 'bg-sky-100 text-sky-700'
                                  }`}>
                                    {ch}
                                  </span>
                                ))}
                                {(() => {
                                  if (isSending) return <span className="rounded-full bg-emerald-500 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">Enviando...</span>
                                  if (camp.status === 'enviada' && hasErrors) return <span className="rounded-full bg-rose-100 text-rose-700 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">Erros detectados</span>
                                  if (camp.status === 'enviada') return <span className="rounded-full bg-slate-100 text-slate-500 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">Concluída</span>
                                  if (camp.status === 'agendada') return <span className="rounded-full bg-sky-100 text-sky-700 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">Agendada</span>
                                  return <span className="rounded-full bg-slate-200 text-slate-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">Rascunho</span>
                                })()}
                              </div>
                            </div>

                            <p className="text-[11px] text-slate-500 line-clamp-1 italic">
                              Criada em {new Date(camp.createdAt).toLocaleDateString('pt-BR')} • {camp.intervalMinSeconds ?? 30}~{camp.intervalMaxSeconds ?? 90}s de intervalo
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2 lg:justify-end">
                            {canSendCampaign && !isSending && (
                              <button
                                type="button"
                                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-600"
                                onClick={() => onRequestSendCampaign(camp)}
                              >
                                {sentCount > 0 ? 'Disparar Novamente' : 'Disparar'}
                              </button>
                            )}
                            {canSendCampaign && camp.status === 'rascunho' && (
                              <button
                                type="button"
                                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                                onClick={() => openScheduleModal(camp.id)}
                              >
                                Agendar
                              </button>
                            )}
                            <button
                              type="button"
                              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                              onClick={() => onSetReportCampaignId(reportCampaignId === camp.id ? null : camp.id)}
                            >
                              {reportCampaignId === camp.id ? 'Fechar Relatório' : 'Relatório'}
                            </button>
                            
                            <div className="relative group/more">
                              <button className="rounded-xl border border-slate-200 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50">
                                ⚙️
                              </button>
                              <div className="absolute right-0 top-full mt-2 hidden w-44 flex-col rounded-2xl border border-slate-200 bg-white p-2 shadow-xl group-hover/more:flex z-[20] before:content-[''] before:absolute before:inset-x-0 before:-top-3 before:h-3">
                                {canCreateCampaign && (
                                  <button onClick={() => onDuplicateCampaign(camp)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50">
                                    <span>📑</span> Duplicar
                                  </button>
                                )}
                                {canEditCampaign && (
                                  <button onClick={() => onStartEditCampaign(camp)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50">
                                    <span>✏️</span> Editar
                                  </button>
                                )}
                                {canDeleteCampaign && (
                                  <button onClick={() => onDeleteCampaign(camp.id)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50">
                                    <span>🗑️</span> Excluir
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {isSending && (
                          <div className="mt-5 space-y-2">
                            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider">
                              <span className="text-emerald-700">Enviando para {progressDone} de {progressTotal} contatos</span>
                              <span className="text-emerald-700">{progressPercent}%</span>
                            </div>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-emerald-100">
                              <div 
                                className="h-full bg-emerald-500 transition-all duration-500" 
                                style={{ width: `${progressPercent}%` }}
                              />
                            </div>
                          </div>
                        )}

                        <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                          <p className="text-[11px] leading-relaxed text-slate-600 line-clamp-2">
                             {htmlToText(camp.message || '') || 'Sem conteúdo textual registrado.'}
                          </p>
                          <div className="mt-3 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400">
                             <span>
                               {log?.lastRunAt ? `Último envio: ${log.lastRunAt}` : 'Nenhum envio registrado'}
                             </span>
                             {sentCount > 0 && pendingContacts.length > 0 && canSendCampaign && !isSending && (
                               <button
                                 onClick={() => onContinueCampaign(camp)}
                                 className="text-amber-600 hover:text-amber-700 underline underline-offset-2"
                               >
                                 Continuar pendentes ({pendingContacts.length})
                               </button>
                             )}
                          </div>
                        </div>

                        {/* Relatório de envios da campanha */}
                        {reportCampaignId === camp.id && (
                          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 text-[11px]">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="font-bold text-slate-800">Relatório Detalhado</h4>
                              <div className="flex items-center gap-2">
                                <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1 text-[9px]">
                                  <button
                                    type="button"
                                    className={`px-3 py-1 rounded-lg transition-all ${reportViewMode === 'all' ? 'bg-white text-slate-800 shadow-sm font-bold' : 'text-slate-500'}`}
                                    onClick={() => onSetReportViewMode('all')}
                                  >
                                    Todos
                                  </button>
                                  <button
                                    type="button"
                                    className={`px-3 py-1 rounded-lg transition-all ${reportViewMode === 'last' ? 'bg-white text-slate-800 shadow-sm font-bold' : 'text-slate-500'}`}
                                    onClick={() => onSetReportViewMode('last')}
                                  >
                                    Último
                                  </button>
                                </div>
                                <button
                                  type="button"
                                  className="h-7 w-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:text-rose-500 transition-colors"
                                  onClick={() => onSetReportCampaignId(null)}
                                >
                                  ✕
                                </button>
                              </div>
                            </div>

                            {(() => {
                              const allEntries = contactSendHistory
                                .filter((h) => h.campaignId === camp.id)
                                .slice()
                                .sort((a, b) => getHistoryTime(b) - getHistoryTime(a))

                              let entries = allEntries
                              if (reportViewMode === 'last' && allEntries.length > 0) {
                                const lastRunAt = allEntries[0].runAt
                                entries = allEntries.filter((e) => e.runAt === lastRunAt)
                              }

                              if (entries.length === 0) {
                                return (
                                  <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                                    <span className="text-2xl mb-2">📊</span>
                                    <p>Nenhum envio registrado.</p>
                                  </div>
                                )
                              }

                              const successCount = entries.filter((e) => e.ok && (!e.status || e.status < 300)).length
                              const errorCount = entries.length - successCount

                              return (
                                <div className="space-y-4">
                                  <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider">
                                    <span className="text-emerald-600">✓ {successCount} SUCESSOS</span>
                                    <span className="text-rose-600">✗ {errorCount} ERROS</span>
                                    <span className="text-slate-400">Total: {entries.length}</span>
                                  </div>

                                  <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-100">
                                    <table className="w-full text-left">
                                      <thead className="sticky top-0 bg-slate-50 text-[9px] font-bold uppercase tracking-widest text-slate-400">
                                        <tr>
                                          <th className="p-2">Contato</th>
                                          <th className="p-2">Canal</th>
                                          <th className="p-2">Composição</th>
                                          <th className="p-2">Status</th>
                                          <th className="p-2">Data</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-50">
                                        {entries.slice(0, 50).map((entry) => (
                                          <tr key={entry.id} className="hover:bg-slate-50/50">
                                            <td className="p-2 font-medium text-slate-700">
                                              {entry.contactName}
                                              <div className="text-[9px] font-normal text-slate-400">{entry.phoneKey}</div>
                                            </td>
                                            <td className="p-2">{entry.channel === 'whatsapp' ? '📱' : '✉️'}</td>
                                            <td className="p-2">
                                              <div className="flex items-center gap-1.5">
                                                {entry.deliverySummary?.sentText && (
                                                  <span className="cursor-help" title="Texto enviado com sucesso">📝</span>
                                                )}
                                                {entry.deliverySummary?.mediaDetails?.map((m: any, idx: number) => (
                                                  <span 
                                                    key={idx} 
                                                    className={`cursor-help text-[10px] ${m.status === 'sent' ? '' : 'filter grayscale opacity-50'}`}
                                                    title={`${m.type.toUpperCase()}: ${m.status === 'sent' ? 'Enviado' : m.status === 'skipped' ? 'Pulado (Erro)' : 'Falhou'}${m.error ? ` - ${m.error}` : ''}`}
                                                  >
                                                    {m.type === 'audio' ? '🎵' : m.type === 'image' ? '🖼️' : '📄'}
                                                    {m.status !== 'sent' && <span className="text-[7px] text-rose-500 absolute -mt-1 ml-[-2px]">✕</span>}
                                                  </span>
                                                ))}
                                                {entry.deliverySummary?.contactSent && (
                                                  <span className="cursor-help" title="Contato compartilhado enviado">👥</span>
                                                )}
                                                {!entry.deliverySummary && entry.ok && <span className="text-[10px] text-slate-400 italic">Legado</span>}
                                              </div>
                                            </td>
                                            <td className="p-2">
                                              <div className="flex flex-col gap-0.5">
                                                <span className={`w-fit rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                                                  entry.ok ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                                }`}>
                                                  {entry.ok ? 'Enviado' : 'Falha'}
                                                </span>
                                                {entry.errorDetail && (
                                                  <div className="mt-1 flex flex-col gap-1 p-2 rounded-lg bg-rose-50/50 border border-rose-100/50 max-w-[280px]">
                                                    <span className="text-[10px] font-bold text-rose-600 uppercase">Erro técnico:</span>
                                                    <span className="text-[9px] text-rose-500 leading-tight break-words whitespace-pre-wrap">
                                                      {entry.errorDetail}
                                                    </span>
                                                  </div>
                                                )}
                                              </div>
                                            </td>
                                            <td className="p-2 text-slate-400 text-[9px] whitespace-nowrap">{entry.runAt}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              )
                            })()}
                          </div>
                        )}
                      </div>
                    </article>
                  )
                })}
              </div>
            </div>
          ))}
        </section>

      {/* Modal de Agendamento Profissional */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Agendamento de Alta Segurança</h3>
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Configuração de Anti-Bloqueio</p>
              </div>
              <button 
                onClick={() => setShowScheduleModal(null)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Data de início</label>
                  <input
                    type="date"
                    value={schedConfig.data_inicio}
                    onChange={(e) => setSchedConfig({ ...schedConfig, data_inicio: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Hora de início</label>
                  <input
                    type="time"
                    value={schedConfig.hora_inicio}
                    onChange={(e) => setSchedConfig({ ...schedConfig, hora_inicio: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Intervalo Mínimo (s)</label>
                  <input 
                    type="number"
                    value={schedConfig.intervalo_minimo}
                    onChange={(e) => setSchedConfig({...schedConfig, intervalo_minimo: Number(e.target.value)})}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Intervalo Máximo (s)</label>
                  <input 
                    type="number"
                    value={schedConfig.intervalo_maximo}
                    onChange={(e) => setSchedConfig({...schedConfig, intervalo_maximo: Number(e.target.value)})}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Msgs por Lote</label>
                  <input 
                    type="number"
                    value={schedConfig.mensagens_por_lote}
                    onChange={(e) => setSchedConfig({...schedConfig, mensagens_por_lote: Number(e.target.value)})}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Pausa Lote (minutos)</label>
                  <input 
                    type="number"
                    value={schedConfig.tempo_pausa_lote}
                    onChange={(e) => setSchedConfig({...schedConfig, tempo_pausa_lote: Number(e.target.value)})}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Limite Diário da Campanha</label>
                <input 
                  type="number"
                  value={schedConfig.limite_diario}
                  onChange={(e) => setSchedConfig({...schedConfig, limite_diario: Number(e.target.value)})}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                <p className="text-[10px] text-slate-400 italic">O sistema pausará automaticamente ao atingir este volume no dia.</p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex gap-3 items-start">
                <span className="text-lg">🛡️</span>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  Esta configuração utiliza <b>Mecanismos Operacionais Profissionais</b>. O worker do backend precisa estar ativo para consumir a fila.
                </p>
              </div>

              {scheduleError && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[11px] text-red-700">
                  {scheduleError}
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
              <button 
                onClick={() => setShowScheduleModal(null)}
                className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700"
              >
                Cancelar
              </button>
              <button 
                onClick={() => void handleConfirmSchedule()}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Ativar Agendamento
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
