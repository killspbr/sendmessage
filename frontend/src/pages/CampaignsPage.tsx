import { useState, useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TextAlign from '@tiptap/extension-text-align'
import Image from '@tiptap/extension-image'
import type { Campaign, CampaignChannel, ContactList, Contact, SendHistoryItem, ContactSendHistoryItem, CampaignSendLog } from '../types'

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
  
  // Estado de envio
  sendingCampaignId: string | null
  sendingCurrentIndex: number
  sendingTotal: number
  sendingErrors: number
  sendingNextDelaySeconds: number | null
  sendConfirmCampaignId: string | null
  
  // Configurações
  webhookUrlWhatsApp: string
  webhookUrlEmail: string
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
  }) => Promise<string | null>
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
  sendingCampaignId,
  sendingCurrentIndex,
  sendingTotal,
  sendingErrors,
  sendingNextDelaySeconds,
  sendConfirmCampaignId,
  webhookUrlWhatsApp,
  webhookUrlEmail,
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
}: CampaignsPageProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        underline: {},
        link: {
          openOnClick: false,
        },
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Image,
    ],
    content: newCampaignMessage || '<p></p>',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      onSetNewCampaignMessage(html)
    },
  })

  useEffect(() => {
    if (!editor) return
    const currentHtml = editor.getHTML()
    if (newCampaignMessage !== currentHtml) {
      editor.commands.setContent(newCampaignMessage || '<p></p>')
    }
  }, [newCampaignMessage, editor])
  const canViewCampaigns = !can || can('campaigns.view')

  const [aiLoading, setAiLoading] = useState<'suggest' | 'rewrite' | null>(null)
  const [aiTone, setAiTone] = useState<'neutral' | 'friendly' | 'sales' | 'educational'>('friendly')
  const [aiGoal, setAiGoal] = useState<'leads' | 'direct_sale' | 'engagement' | 'reactivation'>('leads')
  const [aiCampaignType, setAiCampaignType] = useState<'first_contact' | 'follow_up' | 'recovery'>('first_contact')
  const [aiSegment, setAiSegment] = useState<string>('Genérico')
  const [aiSegmentOther, setAiSegmentOther] = useState<string>('')
  const [aiUseEmojis, setAiUseEmojis] = useState<boolean>(true)
  const [aiLengthLevel, setAiLengthLevel] = useState<number>(5) // 0 (curto) a 10 (detalhado)

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
    : 'Se a IA não funcionar, verifique se há API configurada em "Meu perfil" ou peça ao administrador para definir uma API global.'

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
              className="px-3 py-1.5 rounded-md text-xs font-medium bg-violet-500 text-white hover:bg-violet-400 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => {
                onSetEditingCampaignId(null)
                onSetNewCampaignName('')
                onSetNewCampaignListId(sortedLists[0]?.id || '')
                onSetNewCampaignChannels(['whatsapp'])
                onSetNewCampaignMessage('')
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
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex flex-col gap-1">
                <label htmlFor="new-campaign-name" className="text-[10px] font-medium text-slate-600">
                  {editingCampaignId ? 'Editar campanha' : 'Nome da campanha'}
                </label>
                <input
                  id="new-campaign-name"
                  type="text"
                  value={newCampaignName}
                  onChange={(e) => onSetNewCampaignName(e.target.value)}
                  placeholder="Ex: Campanha WhatsApp Pizzarias"
                  className="h-8 w-64 px-2 rounded-md border border-slate-200 bg-white text-[11px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-violet-400/80"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-medium text-slate-600">Lista</label>
                <select
                  value={newCampaignListId}
                  onChange={(e) => onSetNewCampaignListId(e.target.value)}
                  className="h-8 w-44 px-2 rounded-md border border-slate-200 bg-white text-[11px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-violet-400/80"
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
                          className={`px-1.5 py-0.5 rounded-full text-[9px] border ${
                            aiTone === 'neutral'
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
                          className={`px-1.5 py-0.5 rounded-full text-[9px] border ${
                            aiTone === 'friendly'
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
                          className={`px-1.5 py-0.5 rounded-full text-[9px] border ${
                            aiTone === 'sales'
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
                          className={`px-1.5 py-0.5 rounded-full text-[9px] border ${
                            aiCampaignType === 'first_contact'
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
                          className={`px-1.5 py-0.5 rounded-full text-[9px] border ${
                            aiCampaignType === 'follow_up'
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
                          className={`px-1.5 py-0.5 rounded-full text-[9px] border ${
                            aiCampaignType === 'recovery'
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
                          className="h-6 px-2 rounded-md border border-slate-200 bg-white text-[10px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-violet-400/80"
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
                            className="h-6 w-40 px-2 rounded-md border border-slate-200 bg-white text-[10px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-violet-400/80"
                          />
                        )}
                      </div>

                      <div className="flex items-center gap-1 bg-slate-100 rounded-full px-2 py-0.5" title="Qual é o principal resultado esperado com essa campanha.">
                        <span className="text-[9px] text-slate-500">Objetivo:</span>
                        <button
                          type="button"
                          className={`px-1.5 py-0.5 rounded-full text-[9px] border ${
                            aiGoal === 'leads'
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
                          className={`px-1.5 py-0.5 rounded-full text-[9px] border ${
                            aiGoal === 'direct_sale'
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
                          className={`px-1.5 py-0.5 rounded-full text-[9px] border ${
                            aiGoal === 'engagement'
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
                      <div className="flex items-center gap-2">
                        <label className="text-[9px] text-slate-500" title="Controla o quanto a IA pode alongar ou encurtar o texto sugerido.">
                          Tamanho: {aiLengthLevel}/10
                        </label>
                        <input
                          type="range"
                          min={0}
                          max={10}
                          step={1}
                          value={aiLengthLevel}
                          onChange={(e) => setAiLengthLevel(Number(e.target.value))}
                          title="0 = bem curto, 10 = mais detalhado."
                          className="w-28 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-violet-500"
                        />
                      </div>

                      <label className="flex items-center gap-1 text-[9px] text-slate-600 select-none" title="Quando marcado, a IA pode incluir emojis nas mensagens geradas.">
                        <input
                          type="checkbox"
                          checked={aiUseEmojis}
                          onChange={(e) => setAiUseEmojis(e.target.checked)}
                          className="h-3 w-3 rounded border-slate-300 text-violet-500 focus:ring-violet-400"
                        />
                        <span>Usar emojis no texto</span>
                      </label>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        className={
                          'px-2 py-0.5 rounded-md text-[10px] font-medium ' +
                          (iaDisponivel
                            ? 'bg-violet-500 text-white hover:bg-violet-400 disabled:opacity-50 disabled:cursor-not-allowed'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed')
                        }
                        disabled={!iaDisponivel || aiLoading !== null}
                        title={iaTooltip}
                        onClick={async () => {
                          if (!onGenerateCampaignContentWithAI) return
                          setAiLoading('suggest')
                          const list = lists.find((l) => l.id === newCampaignListId) ?? lists[0]
                          const listName = list?.name ?? newCampaignListId
                          const segmentLabel = aiSegment === 'Outro' && aiSegmentOther.trim() ? aiSegmentOther.trim() : aiSegment
                          const aiDescriptor = ` [IA: tom=${aiTone}, objetivo=${aiGoal}, tipo=${aiCampaignType}, segmento=${segmentLabel}, comprimento=${aiLengthLevel}/10, emojis=${aiUseEmojis ? 'sim' : 'nao'}]`
                          await onGenerateCampaignContentWithAI({
                            mode: 'suggest',
                            currentContent: newCampaignMessage,
                            campaignName: `${newCampaignName || 'Campanha sem nome'}${aiDescriptor}`,
                            listName,
                            channels: newCampaignChannels,
                          })
                          setAiLoading(null)
                        }}
                      >
                        {aiLoading === 'suggest' ? 'Gerando...' : 'Sugerir com IA'}
                      </button>

                      <button
                        type="button"
                        className={
                          'px-2 py-0.5 rounded-md text-[10px] font-medium border ' +
                          (iaDisponivel
                            ? 'border-violet-300 text-violet-700 bg-white hover:bg-violet-50 disabled:opacity-50 disabled:cursor-not-allowed'
                            : 'border-slate-200 text-slate-400 bg-slate-100 cursor-not-allowed')
                        }
                        disabled={!iaDisponivel || aiLoading !== null || !newCampaignMessage.trim()}
                        title={iaTooltip}
                        onClick={async () => {
                          if (!onGenerateCampaignContentWithAI) return
                          setAiLoading('rewrite')
                          const list = lists.find((l) => l.id === newCampaignListId) ?? lists[0]
                          const listName = list?.name ?? newCampaignListId
                          const segmentLabel = aiSegment === 'Outro' && aiSegmentOther.trim() ? aiSegmentOther.trim() : aiSegment
                          const aiDescriptor = ` [IA: tom=${aiTone}, objetivo=${aiGoal}, tipo=${aiCampaignType}, segmento=${segmentLabel}, comprimento=${aiLengthLevel}/10, emojis=${aiUseEmojis ? 'sim' : 'nao'}]`
                          await onGenerateCampaignContentWithAI({
                            mode: 'rewrite',
                            currentContent: newCampaignMessage,
                            campaignName: `${newCampaignName || 'Campanha sem nome'}${aiDescriptor}`,
                            listName,
                            channels: newCampaignChannels,
                          })
                          setAiLoading(null)
                        }}
                      >
                        {aiLoading === 'rewrite' ? 'Reescrevendo...' : 'Reescrever com IA'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="w-full rounded-md border border-slate-200 bg-white min-h-[200px] flex flex-col">
                <div className="flex flex-wrap items-center gap-1 border-b border-slate-100 bg-slate-50 px-2 py-1">
                  <select
                    className="h-6 rounded border border-slate-200 bg-white px-1 text-[10px] text-slate-700"
                    disabled={!editor}
                    value={
                      editor?.isActive('heading', { level: 1 })
                        ? 'h1'
                        : editor?.isActive('heading', { level: 2 })
                        ? 'h2'
                        : editor?.isActive('heading', { level: 3 })
                        ? 'h3'
                        : 'p'
                    }
                    onChange={(e) => {
                      if (!editor) return
                      const value = e.target.value
                      if (value === 'p') editor.chain().focus().setParagraph().run()
                      if (value === 'h1') editor.chain().focus().setHeading({ level: 1 }).run()
                      if (value === 'h2') editor.chain().focus().setHeading({ level: 2 }).run()
                      if (value === 'h3') editor.chain().focus().setHeading({ level: 3 }).run()
                    }}
                  >
                    <option value="p">Parágrafo</option>
                    <option value="h1">Título 1</option>
                    <option value="h2">Título 2</option>
                    <option value="h3">Título 3</option>
                  </select>

                  <button
                    type="button"
                    className={`px-1.5 py-0.5 rounded text-[10px] ${
                      editor?.isActive('bold') ? 'bg-slate-800 text-white' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                    disabled={!editor}
                    onClick={() => editor?.chain().focus().toggleBold().run()}
                  >
                    N
                  </button>
                  <button
                    type="button"
                    className={`px-1.5 py-0.5 rounded text-[10px] ${
                      editor?.isActive('italic') ? 'bg-slate-800 text-white' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                    disabled={!editor}
                    onClick={() => editor?.chain().focus().toggleItalic().run()}
                  >
                    I
                  </button>
                  <button
                    type="button"
                    className={`px-1.5 py-0.5 rounded text-[10px] ${
                      editor?.isActive('underline')
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                    disabled={!editor}
                    onClick={() => editor?.chain().focus().toggleUnderline().run()}
                  >
                    U
                  </button>
                  <button
                    type="button"
                    className={`px-1.5 py-0.5 rounded text-[10px] ${
                      editor?.isActive('strike')
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                    disabled={!editor}
                    onClick={() => editor?.chain().focus().toggleStrike().run()}
                  >
                    S
                  </button>
                  <button
                    type="button"
                    className={`px-1.5 py-0.5 rounded text-[10px] ${
                      editor?.isActive('heading', { level: 2 })
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                    disabled={!editor}
                    onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                  >
                    H2
                  </button>
                  <button
                    type="button"
                    className={`px-1.5 py-0.5 rounded text-[10px] ${
                      editor?.isActive('paragraph') ? 'bg-slate-800 text-white' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                    disabled={!editor}
                    onClick={() => editor?.chain().focus().setParagraph().run()}
                  >
                    P
                  </button>
                  <span className="h-4 w-px bg-slate-200 mx-1" />
                  <button
                    type="button"
                    className="px-1.5 py-0.5 rounded text-[10px] text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                    disabled={!editor}
                    onClick={() => {
                      if (!editor) return
                      const url = window.prompt('URL da imagem:')?.trim()
                      if (!url) return
                      editor.chain().focus().setImage({ src: url }).run()
                    }}
                  >
                    Img
                  </button>
                  <button
                    type="button"
                    className={`px-1.5 py-0.5 rounded text-[10px] ${
                      editor?.isActive('link')
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                    disabled={!editor}
                    onClick={() => {
                      if (!editor) return
                      const prevUrl = editor.getAttributes('link').href as string | undefined
                      const url = window.prompt('URL do link:', prevUrl || '')?.trim()
                      if (!url) {
                        editor.chain().focus().unsetLink().run()
                        return
                      }
                      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
                    }}
                  >
                    Link
                  </button>
                  <button
                    type="button"
                    className="px-1.5 py-0.5 rounded text-[10px] text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                    disabled={!editor}
                    onClick={() => editor?.chain().focus().unsetLink().run()}
                  >
                    Sem link
                  </button>
                  <span className="h-4 w-px bg-slate-200 mx-1" />
                  <button
                    type="button"
                    className={`px-1.5 py-0.5 rounded text-[10px] ${
                      editor?.isActive('bulletList')
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                    disabled={!editor}
                    onClick={() => editor?.chain().focus().toggleBulletList().run()}
                  >
                    • Lista
                  </button>
                  <button
                    type="button"
                    className={`px-1.5 py-0.5 rounded text-[10px] ${
                      editor?.isActive('orderedList')
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                    disabled={!editor}
                    onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                  >
                    1. Lista
                  </button>
                  <button
                    type="button"
                    className={`px-1.5 py-0.5 rounded text-[10px] ${
                      editor?.isActive('blockquote')
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                    disabled={!editor}
                    onClick={() => editor?.chain().focus().toggleBlockquote().run()}
                  >
                    ❝
                  </button>
                  <span className="h-4 w-px bg-slate-200 mx-1" />
                  <button
                    type="button"
                    className={`px-1.5 py-0.5 rounded text-[10px] ${
                      editor?.isActive({ textAlign: 'left' })
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                    disabled={!editor}
                    onClick={() => editor?.chain().focus().setTextAlign('left').run()}
                  >
                    ⬅
                  </button>
                  <button
                    type="button"
                    className={`px-1.5 py-0.5 rounded text-[10px] ${
                      editor?.isActive({ textAlign: 'center' })
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                    disabled={!editor}
                    onClick={() => editor?.chain().focus().setTextAlign('center').run()}
                  >
                    ⬌
                  </button>
                  <button
                    type="button"
                    className={`px-1.5 py-0.5 rounded text-[10px] ${
                      editor?.isActive({ textAlign: 'right' })
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                    disabled={!editor}
                    onClick={() => editor?.chain().focus().setTextAlign('right').run()}
                  >
                    ➡
                  </button>
                  <button
                    type="button"
                    className={`px-1.5 py-0.5 rounded text-[10px] ${
                      editor?.isActive({ textAlign: 'justify' })
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                    disabled={!editor}
                    onClick={() => editor?.chain().focus().setTextAlign('justify').run()}
                  >
                    ☰
                  </button>
                  <span className="h-4 w-px bg-slate-200 mx-1" />
                  <button
                    type="button"
                    className="px-1.5 py-0.5 rounded text-[10px] text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                    disabled={!editor}
                    onClick={() => editor?.chain().focus().undo().run()}
                  >
                    Undo
                  </button>
                  <button
                    type="button"
                    className="px-1.5 py-0.5 rounded text-[10px] text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                    disabled={!editor}
                    onClick={() => editor?.chain().focus().redo().run()}
                  >
                    Redo
                  </button>
                </div>
                <EditorContent editor={editor} className="flex-1 px-3 py-2 text-[13px] leading-relaxed outline-none" />
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Use este editor para formatar o texto da campanha com títulos, listas, cores e outros recursos. Quando a IA for usada, revise o texto antes de salvar.
                {!geminiApiKey && ' Para integrar IA, informe a Gemini API Key nas configurações.'}
                {' Aviso visível apenas aqui na tela: esta mensagem pode ter sido gerada com auxílio de IA, mas este aviso não será enviado aos contatos.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-medium text-slate-600">Pré-visualização (email)</label>
                <div className="w-full px-3 py-2 rounded-md border border-slate-200 bg-white text-[11px] text-slate-700 min-h-[120px] overflow-auto [&_p]:mb-3 [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-1">
                  {newCampaignMessage.trim() ? (
                    <div dangerouslySetInnerHTML={{ __html: newCampaignMessage }} />
                  ) : (
                    <p className="text-[10px] text-slate-400">
                      A pré-visualização do email aparecerá aqui conforme você montar o conteúdo da campanha.
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-medium text-slate-600">Pré-visualização (WhatsApp)</label>
                <div className="w-full px-3 py-2 rounded-md border border-slate-200 bg-white text-[11px] text-slate-700 min-h-[120px] overflow-auto whitespace-pre-wrap">
                  {newCampaignMessage.trim() ? (
                    <span>{htmlToWhatsapp(newCampaignMessage)}</span>
                  ) : (
                    <p className="text-[10px] text-slate-400">
                      A pré-visualização do texto que será enviado ao WhatsApp aparecerá aqui.
                    </p>
                  )}
                </div>
              </div>
            </div>

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
                          className="h-7 w-16 px-1 rounded-md border border-slate-200 bg-white text-[10px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-violet-400/80"
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
                          className="h-7 w-16 px-1 rounded-md border border-slate-200 bg-white text-[10px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-violet-400/80"
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
                  className="h-8 px-3 rounded-md text-[11px] font-medium bg-violet-500 text-white hover:bg-violet-400 disabled:opacity-40 disabled:cursor-not-allowed"
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
              <div className="h-10 w-10 rounded-full bg-violet-500/10 text-violet-500 flex items-center justify-center text-lg">
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
                  ch === 'whatsapp' ? !!webhookUrlWhatsApp.trim() : !!webhookUrlEmail.trim(),
                )

                const min = campToSend.intervalMinSeconds ?? 30
                const max = campToSend.intervalMaxSeconds ?? 90

                return (
                  <div className="rounded-lg border border-violet-200 bg-violet-50/80 px-3 py-2 flex flex-col gap-2 text-[11px] text-violet-900">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 flex flex-col gap-0.5">
                        <span className="font-semibold">
                          Confirmar disparo da campanha "{campToSend.name}"?
                        </span>
                        <span className="text-[10px] text-violet-800">
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
                        className="px-2.5 py-1 rounded-md bg-violet-600 text-[11px] text-white hover:bg-violet-500"
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

              {/* Indicador de envio em andamento */}
              {sendingCampaignId && (() => {
                const sendingCamp = campaigns.find((c) => c.id === sendingCampaignId)
                const min = sendingCamp?.intervalMinSeconds ?? 30
                const max = sendingCamp?.intervalMaxSeconds ?? 90

                return (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 px-3 py-2 flex flex-col gap-1 text-[11px] text-emerald-900">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">
                      Envio em andamento: {
                        campaigns.find((c) => c.id === sendingCampaignId)?.name || 'Campanha'
                      }
                    </span>
                    <span className="text-[10px]">
                      {sendingCurrentIndex} de {sendingTotal} contatos
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-emerald-100 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-300"
                      style={{
                        width:
                          sendingTotal > 0
                            ? `${Math.min(100, Math.max(0, (sendingCurrentIndex / sendingTotal) * 100))}%`
                            : '0%',
                      }}
                    />
                  </div>
                  <div className="flex flex-col gap-0.5 text-[10px] mt-0.5">
                    <div className="flex items-center justify-between">
                      <span>
                        Intervalo automático entre disparos: entre {min}s e {max}s por contato.
                      </span>
                      <span>Erros: {sendingErrors}</span>
                    </div>
                    {sendingNextDelaySeconds != null && sendingNextDelaySeconds > 0 && (
                      <div className="flex items-center justify-between text-emerald-800">
                        <span>
                          Próximo envio em <strong>{sendingNextDelaySeconds}s</strong>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                )
              })()}

              {/* Lista de campanhas */}
              {campaigns.map((camp) => (
                <div key={camp.id} className="flex flex-col gap-2">
                  <div
                    className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 cursor-pointer hover:bg-slate-100 transition"
                    onClick={() => onSetReportCampaignId(reportCampaignId === camp.id ? null : camp.id)}
                  >
                    <div className="flex flex-col">
                      <span className="text-[11px] font-medium text-slate-800 flex items-center gap-1">
                        <span>{camp.name}</span>
                        <span className="text-[10px] font-normal text-slate-500">
                          ({camp.intervalMinSeconds ?? 30}~{camp.intervalMaxSeconds ?? 90}s)
                        </span>
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {camp.listName} • {camp.createdAt}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {(() => {
                          const log = campaignSendLog[camp.id]
                          if (log) {
                            return `Último envio: ${
                              log.lastOk ? 'OK' : `Erro ${log.lastErrorCount > 0 ? 500 : 0}`
                            } · ${log.lastRunAt}`
                          }

                          const historyForCamp = sendHistory.filter(
                            (h) => h.campaignId === camp.id,
                          )
                          if (historyForCamp.length > 0) {
                            const total = historyForCamp.reduce((acc, h) => acc + h.total, 0)
                            const errors = historyForCamp.reduce((acc, h) => acc + h.errorCount, 0)
                            const successes = total - errors
                            return `Histórico: ${successes} sucesso(s), ${errors} erro(s), total ${total}`
                          }

                          return 'Nenhum disparo registrado para esta campanha.'
                        })()}
                      </span>
                      <span className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">
                        {(() => {
                          const plain = htmlToText(camp.message || '')
                          if (!plain) return 'Sem pré-visualização de conteúdo.'
                          return plain.length > 180 ? `${plain.slice(0, 180)}…` : plain
                        })()}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 md:gap-2 justify-end md:justify-start">
                      {camp.channels.map((ch) => (
                        <span
                          key={ch}
                          className={`text-[10px] px-2 py-0.5 rounded-full border ${
                            ch === 'whatsapp'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                              : 'bg-sky-50 text-sky-700 border-sky-100'
                          }`}
                        >
                          {ch === 'whatsapp' ? 'WhatsApp' : 'Email'}
                        </span>
                      ))}
                      {(() => {
                        const log = campaignSendLog[camp.id]
                        const hasErrors = !!log && log.lastErrorCount > 0 && !log.lastOk
                        const baseClasses = 'text-[10px] px-2 py-0.5 rounded-full border '

                        if (camp.status === 'enviada' && hasErrors) {
                          return (
                            <span
                              className={
                                baseClasses + 'bg-amber-50 text-amber-800 border-amber-200'
                              }
                              title={`Último envio com erros · ${log.lastErrorCount} contato(s) com falha`}
                            >
                              Enviada com erros
                            </span>
                          )
                        }

                        if (camp.status === 'enviada') {
                          return (
                            <span
                              className={
                                baseClasses + 'bg-emerald-50 text-emerald-700 border-emerald-100'
                              }
                              title={log?.lastRunAt ? `Último envio em ${log.lastRunAt}` : undefined}
                            >
                              Enviada
                            </span>
                          )
                        }

                        if (camp.status === 'agendada') {
                          return (
                            <span
                              className={
                                baseClasses + 'bg-sky-50 text-sky-700 border-sky-100'
                              }
                            >
                              Agendada
                            </span>
                          )
                        }

                        return (
                          <span
                            className={
                              baseClasses + 'bg-amber-50 text-amber-700 border-amber-100'
                            }
                          >
                            Rascunho
                          </span>
                        )
                      })()}
                      {canSendCampaign && (
                        <button
                          type="button"
                          className="text-[10px] px-2 py-0.5 rounded-md border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
                          onClick={(e) => { e.stopPropagation(); onRequestSendCampaign(camp) }}
                          disabled={!canSendCampaign}
                        >
                          Disparar
                        </button>
                      )}
                      {(() => {
                        const { pendingContacts, contactsForList } = getPendingContacts(camp)
                        const sentCount = contactsForList.length - pendingContacts.length
                        if (sentCount > 0 && pendingContacts.length > 0 && canSendCampaign) {
                          return (
                            <button
                              type="button"
                              className="text-[10px] px-2 py-0.5 rounded-md border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
                              onClick={(e) => { e.stopPropagation(); onContinueCampaign(camp) }}
                              title={`${pendingContacts.length} contato(s) ainda não receberam esta campanha com sucesso. Somente esses serão reenviados.`}
                              disabled={!canSendCampaign}
                            >
                              Reenviar pendentes ({pendingContacts.length})
                            </button>
                          )
                        }
                        return null
                      })()}
                      {canCreateCampaign && (
                        <button
                          type="button"
                          className="text-[10px] px-2 py-0.5 rounded-md border border-slate-300 text-slate-600 hover:bg-slate-100 whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
                          onClick={(e) => { e.stopPropagation(); onDuplicateCampaign(camp) }}
                          disabled={!canCreateCampaign}
                        >
                          Duplicar
                        </button>
                      )}
                      {canEditCampaign && (
                        <button
                          type="button"
                          className="text-[10px] px-2 py-0.5 rounded-md border border-slate-300 text-slate-600 hover:bg-slate-100 whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
                          onClick={(e) => { e.stopPropagation(); onStartEditCampaign(camp) }}
                          disabled={!canEditCampaign}
                        >
                          Editar
                        </button>
                      )}
                      {canDeleteCampaign && (
                        <button
                          type="button"
                          className="text-[10px] px-2 py-0.5 rounded-md border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
                          onClick={(e) => { e.stopPropagation(); onDeleteCampaign(camp.id) }}
                          disabled={!canDeleteCampaign}
                        >
                          Excluir
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Relatório de envios da campanha */}
                  {reportCampaignId === camp.id && (
                    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-slate-800">Relatório de envios</span>
                        <div className="flex items-center gap-2">
                          <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 p-[1px] text-[9px]">
                            <button
                              type="button"
                              className={`px-2 py-0.5 rounded-full ${
                                reportViewMode === 'all'
                                  ? 'bg-white text-slate-800 shadow-sm'
                                  : 'text-slate-500'
                              }`}
                              onClick={(e) => {
                                e.stopPropagation()
                                onSetReportViewMode('all')
                              }}
                            >
                              Todos
                            </button>
                            <button
                              type="button"
                              className={`px-2 py-0.5 rounded-full ${
                                reportViewMode === 'last'
                                  ? 'bg-white text-slate-800 shadow-sm'
                                  : 'text-slate-500'
                              }`}
                              onClick={(e) => {
                                e.stopPropagation()
                                onSetReportViewMode('last')
                              }}
                            >
                              Último envio
                            </button>
                          </div>
                          <button
                            type="button"
                            className="text-[10px] text-slate-500 hover:text-slate-700"
                            onClick={(e) => { e.stopPropagation(); onSetReportCampaignId(null) }}
                          >
                            Fechar
                          </button>
                        </div>
                      </div>
                      {(() => {
                        const allEntries = contactSendHistory
                          .filter((h) => h.campaignId === camp.id)
                          .slice()
                          .sort((a, b) => b.runAt.localeCompare(a.runAt))

                        let entries = allEntries

                        if (reportViewMode === 'last' && allEntries.length > 0) {
                          const lastRunAt = allEntries[0].runAt
                          entries = allEntries.filter((e) => e.runAt === lastRunAt)
                        }
                        if (entries.length === 0) {
                          return (
                            <p className="text-slate-400 text-[10px]">Nenhum envio registrado para esta campanha.</p>
                          )
                        }
                        const successCount = entries.filter((e) => e.ok).length
                        const errorCount = entries.filter((e) => !e.ok).length

                        const handleExportCsv = (e: React.MouseEvent<HTMLButtonElement>) => {
                          e.stopPropagation()
                          if (entries.length === 0) return

                          const header = [
                            'campanha',
                            'contato',
                            'telefone',
                            'canal',
                            'status_ok',
                            'webhook_ok',
                            'data_hora',
                          ]

                          const rows = entries.map((entry) => [
                            camp.name,
                            entry.contactName,
                            entry.phoneKey,
                            entry.channel,
                            entry.ok ? '1' : '0',
                            entry.webhookOk === false ? '0' : '1',
                            entry.runAt,
                          ])

                          const csvLines = [
                            header.join(';'),
                            ...rows.map((cols) =>
                              cols
                                .map((value) => {
                                  const safe = (value ?? '').toString().replace(/"/g, '""')
                                  return safe.includes(';') || safe.includes('"') || safe.includes('\n')
                                    ? `"${safe}` + '"'
                                    : safe
                                })
                                .join(';'),
                            ),
                          ]

                          const blob = new Blob([csvLines.join('\n')], {
                            type: 'text/csv;charset=utf-8;',
                          })
                          const url = URL.createObjectURL(blob)
                          const link = document.createElement('a')
                          const fileNameBase = camp.name || 'campanha'
                          const fileName = `relatorio-${fileNameBase}`
                            .toLowerCase()
                            .replace(/\s+/g, '-')
                            .replace(/[^a-z0-9\-]/g, '')
                          link.href = url
                          link.setAttribute('download', `${fileName}.csv`)
                          document.body.appendChild(link)
                          link.click()
                          document.body.removeChild(link)
                          URL.revokeObjectURL(url)
                        }
                        return (
                          <>
                            <div className="flex items-center justify-between gap-3 mb-2 text-[10px]">
                              <div className="flex items-center gap-3">
                                <span className="text-emerald-700">✓ {successCount} sucesso(s)</span>
                                <span className="text-red-600">✗ {errorCount} erro(s)</span>
                                <span className="text-slate-500">Total: {entries.length}</span>
                              </div>
                              <button
                                type="button"
                                className="px-2 py-0.5 rounded-md border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 text-[10px]"
                                onClick={handleExportCsv}
                              >
                                Exportar CSV
                              </button>
                            </div>
                            <div className="max-h-48 overflow-y-auto border-t border-slate-100 pt-1">
                              <table className="w-full text-[10px]">
                                <thead className="sticky top-0 bg-white">
                                  <tr className="text-left text-slate-500">
                                    <th className="py-1 pr-2">Contato</th>
                                    <th className="py-1 pr-2">Telefone</th>
                                    <th className="py-1 pr-2">Canal</th>
                                    <th className="py-1 pr-2">Status</th>
                                    <th className="py-1">Data/Hora</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {entries.map((entry) => (
                                    <tr key={entry.id} className="border-t border-slate-50">
                                      <td className="py-1 pr-2 text-slate-700">{entry.contactName}</td>
                                      <td className="py-1 pr-2 text-slate-500">{entry.phoneKey}</td>
                                      <td className="py-1 pr-2">
                                        <span className="inline-flex items-center">
                                          {entry.channel === 'whatsapp' ? '📱' : '✉️'}
                                        </span>
                                      </td>
                                      <td className="py-1 pr-2">
                                        <div className="flex items-center gap-1.5">
                                          <span
                                            className={`px-1.5 py-0.5 rounded-full text-[9px] font-medium flex items-center justify-center ${
                                              entry.webhookOk === false
                                                ? 'bg-red-50 text-red-700 border border-red-200'
                                                : 'bg-sky-50 text-sky-700 border border-sky-200'
                                            }`}
                                            title={
                                              entry.webhookOk === false
                                                ? 'Webhook não funcionou.'
                                                : 'Webhook funcionou.'
                                            }
                                          >
                                            <span aria-hidden="true">🔌</span>
                                          </span>
                                          <span
                                            className={`px-1.5 py-0.5 rounded-full text-[9px] font-medium cursor-help flex items-center justify-center ${
                                              entry.ok
                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                : 'bg-red-50 text-red-700 border border-red-200'
                                            }`}
                                            title={
                                              entry.ok
                                                ? 'Mensagem enviada.'
                                                : entry.channel === 'email'
                                                ? 'Erro no envio, verifique o endereço de e-mail.'
                                                : 'Erro no envio, verifique o telefone.'
                                            }
                                          >
                                            <span aria-hidden="true">💬</span>
                                          </span>
                                        </div>
                                      </td>
                                      <td className="py-1 text-slate-500">{entry.runAt}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </>
                        )
                      })()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        )}
      </section>
    </>
  )
}
