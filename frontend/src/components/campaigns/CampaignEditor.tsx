import { useEffect, useMemo, useState } from 'react'
import { sanitizeHtmlForEmail } from '../../utils/htmlTransform'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import Image from '@tiptap/extension-image'
import type { CampaignChannel, CampaignMediaItem, CampaignSharedContact, CampaignPoll, CampaignButton } from '../../types'

type CampaignEditorProps = {
  content: string
  onChange: (html: string) => void
  onGenerateAI?: (options: { mode: 'suggest' | 'rewrite' | 'custom'; customInstructions?: string; selectedContent?: string }) => Promise<void>
  aiLoading: 'suggest' | 'rewrite' | 'custom' | null
  channels: CampaignChannel[]
  htmlToWhatsapp: (html: string) => string
  mediaItems?: CampaignMediaItem[]
  sharedContact?: CampaignSharedContact | null
  poll: CampaignPoll | null
  onChangePoll: (poll: CampaignPoll | null) => void
}

const variables = [
  { label: 'Nome completo', value: '{name}' },
  { label: 'Primeiro nome', value: '{primeiro_nome}' },
  { label: 'Telefone', value: '{phone}' },
  { label: 'Categoria', value: '{category}' },
  { label: 'Cidade', value: '{city}' },
  { label: 'Email', value: '{email}' },
  { label: 'Avaliação', value: '{rating}' },
]

const quickBlocks = [
  { label: 'Abertura comercial', html: '<p>Olá, {primeiro_nome}! Tudo bem?</p><p>Passando para apresentar uma oportunidade rápida.</p>' },
  { label: 'Oferta direta', html: '<p><strong>Oferta especial</strong> por tempo limitado para {category} em {city}.</p>' },
  { label: 'Follow-up curto', html: '<p>Retomando nosso contato anterior para ver se faz sentido avançarmos.</p>' },
]

const testData = {
  '{name}': 'João Silva',
  '{primeiro_nome}': 'João',
  '{phone}': '(11) 99999-9999',
  '{category}': 'Loja de autopeças',
  '{city}': 'São Bernardo do Campo',
  '{email}': 'joao@exemplo.com.br',
  '{rating}': '4.8',
}

const resolveTemplate = (template: string, data: Record<string, string>) =>
  Object.entries(data).reduce((acc, [key, value]) => acc.replace(new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value), template)

const normalizeWhatsappPreview = (text: string) =>
  String(text || '')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{2,}•/g, '\n•')
    .replace(/•\s*\n+/g, '• ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

const EDITOR_EXTENSIONS = [
  StarterKit.configure({ link: false, underline: false }),
  Underline,
  Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-emerald-700 underline' } }),
  TextAlign.configure({ types: ['heading', 'paragraph'] }),
  Image.configure({ HTMLAttributes: { class: 'rounded-xl max-w-full h-auto my-4 shadow-md' } }),
]

function ToolbarButton({
  active,
  onClick,
  label,
}: {
  active?: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
        active ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
      }`}
    >
      {label}
    </button>
  )
}

export function CampaignEditor({
  content,
  onChange,
  onGenerateAI,
  aiLoading,
  channels,
  htmlToWhatsapp,
  mediaItems = [],
  sharedContact = null,
  poll,
  onChangePoll,
}: CampaignEditorProps) {
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor')
  const [useTestData, setUseTestData] = useState(false)
  const [isAiModalOpen, setIsAiModalOpen] = useState(false)
  const [customAiInstructions, setCustomAiInstructions] = useState('')
  const [selectedText, setSelectedText] = useState('')

  const editor = useEditor({
    extensions: EDITOR_EXTENSIONS,
    content: content || '<p></p>',
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none min-h-[360px] px-5 py-5 focus:outline-none text-slate-800',
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection
      if (from === to) {
        setSelectedText('')
      } else {
        setSelectedText(editor.state.doc.textBetween(from, to, ' '))
      }
    },
  })

  useEffect(() => {
    if (!editor) return
    if (content !== editor.getHTML()) editor.commands.setContent(content || '<p></p>')
  }, [content, editor])

  const charCount = useMemo(() => editor?.getText().length ?? 0, [editor, content])
  const wordCount = useMemo(() => {
    const text = editor?.getText().trim() || ''
    return text ? text.split(/\s+/).length : 0
  }, [editor, content])
  const finalContent = useMemo(() => (useTestData ? resolveTemplate(content, testData) : content), [content, useTestData])
  const whatsappPreview = useMemo(
    () => normalizeWhatsappPreview(htmlToWhatsapp(finalContent)),
    [finalContent, htmlToWhatsapp]
  )
  const previewContact = useMemo(() => {
    if (!sharedContact) return null
    const base = useTestData
      ? {
          fullName: resolveTemplate(sharedContact.fullName || '', testData),
          phone: resolveTemplate(sharedContact.phone || '', testData),
          company: resolveTemplate(sharedContact.company || '', testData),
          email: resolveTemplate(sharedContact.email || '', testData),
          url: resolveTemplate(sharedContact.url || '', testData),
        }
      : sharedContact

    const hasData = Object.values(base).some((value) => String(value || '').trim())
    return hasData ? base : null
  }, [sharedContact, useTestData])

  const insertVariable = (value: string) => editor?.chain().focus().insertContent(value).run()
  const insertQuickBlock = (html: string) => editor?.chain().focus().insertContent(html).run()

  const handleCustomAiGenerate = async () => {
    if (!customAiInstructions.trim()) return
    await onGenerateAI?.({ mode: 'custom', customInstructions: customAiInstructions })
    setIsAiModalOpen(false)
    setCustomAiInstructions('')
  }

  const handleRewriteSelection = async () => {
    if (!selectedText.trim()) return
    await onGenerateAI?.({ mode: 'rewrite', selectedContent: selectedText })
  }

  if (!editor) return null

  return (
    <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm relative">
      {isAiModalOpen && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-6">
          <div className="w-full max-w-md rounded-[32px] bg-white p-8 shadow-2xl ring-1 ring-slate-900/5">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">O que você deseja gerar?</h3>
              <button 
                onClick={() => setIsAiModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              Descreva com suas palavras o que a IA deve escrever ou como ela deve alterar o conteúdo atual.
            </p>
            <textarea
              autoFocus
              value={customAiInstructions}
              onChange={(e) => setCustomAiInstructions(e.target.value)}
              placeholder="Ex: Escreva uma saudação amigável para clientes de pet shop convidando para o banho e tosa..."
              className="w-full h-40 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all resize-none mb-6"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setIsAiModalOpen(false)}
                className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                disabled={!customAiInstructions.trim() || aiLoading === 'custom'}
                onClick={handleCustomAiGenerate}
                className="flex-2 rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-slate-900/10"
              >
                {aiLoading === 'custom' ? 'Processando...' : 'Gerar com IA'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Editor de campanha</div>
            <div className="mt-1 text-sm text-slate-600">Edição rica, variáveis dinâmicas e geração assistida por IA.</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setActiveTab('editor')} className={`rounded-2xl px-4 py-2 text-xs font-semibold ${activeTab === 'editor' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200'}`}>Editor</button>
            <button onClick={() => setActiveTab('preview')} className={`rounded-2xl px-4 py-2 text-xs font-semibold ${activeTab === 'preview' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200'}`}>Pré-visualização</button>
          </div>
        </div>
      </div>

      <div className="grid gap-0 xl:grid-cols-[1fr_320px]">
        <div className="border-r border-slate-200">
          {activeTab === 'editor' ? (
            <>
              <div className="flex flex-wrap gap-2 border-b border-slate-200 bg-white px-4 py-3">
                <ToolbarButton active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} label="Negrito" />
                <ToolbarButton active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} label="Itálico" />
                <ToolbarButton active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} label="Sublinhado" />
                <ToolbarButton active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} label="Lista" />
                <ToolbarButton active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} label="Numerada" />
                <ToolbarButton active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()} label="Citação" />
                <ToolbarButton active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} label="Título" />
                <ToolbarButton active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()} label="Esquerda" />
                <ToolbarButton active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()} label="Centro" />
                <ToolbarButton active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()} label="Direita" />
                <ToolbarButton onClick={() => editor.chain().focus().undo().run()} label="Desfazer" />
                <ToolbarButton onClick={() => editor.chain().focus().redo().run()} label="Refazer" />
                <ToolbarButton onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} label="Limpar formatação" />
              </div>

              <div className="min-h-[420px] bg-white">
                <EditorContent editor={editor} />
              </div>

              <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-5 py-3 text-xs text-slate-500">
                <div className="flex flex-wrap gap-3">
                  <span>{charCount} caracteres</span>
                  <span>{wordCount} palavras</span>
                  <span>{channels.includes('whatsapp') ? 'WhatsApp ativo' : 'WhatsApp inativo'}</span>
                  <span>{channels.includes('email') ? 'Email ativo' : 'Email inativo'}</span>
                </div>
                <div>Use as variáveis e blocos rápidos ao lado para acelerar a criação.</div>
              </div>
            </>
          ) : (
            <div className="grid min-h-[520px] gap-6 bg-slate-50 p-6 lg:grid-cols-2">
              {channels.includes('whatsapp') && (
                <div className="rounded-[24px] border border-slate-200 bg-[#e5ddd5] p-4 shadow-sm">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">WhatsApp</span>
                    <label className="inline-flex items-center gap-2 text-xs text-slate-600">
                      <input type="checkbox" checked={useTestData} onChange={(e) => setUseTestData(e.target.checked)} className="h-4 w-4 accent-emerald-500" />
                      Simular dados reais
                    </label>
                  </div>
                  <div className="rounded-2xl bg-white p-4 shadow-sm">
                    <div className="whitespace-pre-wrap break-words text-sm text-slate-800">
                      {whatsappPreview || <span className="italic text-slate-400">Mensagem vazia...</span>}
                    </div>
                  </div>
                  {mediaItems.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {mediaItems.map((item, index) => (
                        <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                            {item.mediaType === 'document'
                              ? 'Documento'
                              : item.mediaType === 'audio'
                                ? 'Audio'
                                : 'Imagem'}{' '}
                            {index + 1}
                          </div>
                          <div className="mt-1 truncate text-xs text-slate-500">{item.url || 'URL pendente'}</div>
                          {item.caption && (
                            <div className="mt-2 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">
                              {useTestData ? resolveTemplate(item.caption, testData) : item.caption}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {previewContact && (
                    <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Contato compartilhado</div>
                      <div className="mt-2 text-sm font-semibold text-slate-800">{previewContact.fullName}</div>
                      {previewContact.company && <div className="text-sm text-slate-600">{previewContact.company}</div>}
                      {previewContact.phone && <div className="mt-1 text-sm text-slate-700">{previewContact.phone}</div>}
                      {previewContact.email && <div className="text-sm text-slate-500">{previewContact.email}</div>}
                      {previewContact.url && <div className="text-sm text-slate-500">{previewContact.url}</div>}
                    </div>
                  )}
                </div>
              )}
              {channels.includes('email') && (
                <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Email</div>
                  <div className="prose prose-sm max-w-none text-slate-800">
                    {finalContent.trim() ? <div dangerouslySetInnerHTML={{ __html: sanitizeHtmlForEmail(finalContent) }} /> : <p className="italic text-slate-400">Conteúdo vazio...</p>}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <aside className="flex flex-col gap-5 bg-slate-50 px-5 py-5">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm ring-1 ring-slate-900/[0.02]">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Assistente IA</div>
            <div className="mt-2 text-sm text-slate-600">Use a IA para começar um texto do zero ou refinar o conteúdo.</div>
            <div className="mt-4 grid gap-2">
              <button 
                onClick={() => setIsAiModalOpen(true)} 
                disabled={!onGenerateAI || !!aiLoading} 
                className="flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60 shadow-lg shadow-slate-900/10"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                {aiLoading === 'custom' ? 'Gerando...' : 'Descrever conteúdo'}
              </button>
              
              <div className="h-[1px] bg-slate-100 my-1"></div>

              <button 
                onClick={() => onGenerateAI?.({ mode: 'suggest' })} 
                disabled={!onGenerateAI || !!aiLoading} 
                className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
              >
                {aiLoading === 'suggest' ? 'Gerando sugestão...' : 'Sugestão dinâmica'}
              </button>

              <button 
                onClick={() => onGenerateAI?.({ mode: 'rewrite' })} 
                disabled={!onGenerateAI || !!aiLoading || !content.trim()} 
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
              >
                {aiLoading === 'rewrite' ? 'Reescrevendo...' : 'Reescrever tudo'}
              </button>

              {selectedText && (
                <button 
                  onClick={handleRewriteSelection} 
                  disabled={!onGenerateAI || !!aiLoading} 
                  className="rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm font-semibold text-amber-700 transition hover:bg-amber-100 animate-in fade-in slide-in-from-top-1"
                >
                  {aiLoading === 'rewrite' ? 'Aprimorando...' : 'Melhorar seleção'}
                </button>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Variáveis dinâmicas</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {variables.map((item) => (
                <button key={item.value} type="button" onClick={() => insertVariable(item.value)} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-700">
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Blocos rápidos</div>
            <div className="mt-3 grid gap-2">
              {quickBlocks.map((block) => (
                <button key={block.label} type="button" onClick={() => insertQuickBlock(block.html)} className="rounded-2xl border border-slate-200 px-3 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                  {block.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Boas práticas</div>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>Use abertura curta e contexto claro nos primeiros 2 parágrafos.</li>
              <li>Evite blocos excessivamente longos em campanhas de WhatsApp.</li>
              <li>Mantenha CTA explícito quando estiver buscando resposta.</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  )
}
