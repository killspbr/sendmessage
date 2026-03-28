import { useEffect, useMemo, useState } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import Image from '@tiptap/extension-image'
import type { CampaignChannel, CampaignMediaItem, CampaignSharedContact } from '../../types'

type CampaignEditorProps = {
  content: string
  onChange: (html: string) => void
  onGenerateAI?: (options: { mode: 'suggest' | 'rewrite' }) => Promise<void>
  aiLoading: 'suggest' | 'rewrite' | null
  channels: CampaignChannel[]
  htmlToWhatsapp: (html: string) => string
  mediaItems?: CampaignMediaItem[]
  sharedContact?: CampaignSharedContact | null
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
}: CampaignEditorProps) {
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor')
  const [useTestData, setUseTestData] = useState(false)

  const editor = useEditor({
    extensions: EDITOR_EXTENSIONS,
    content: content || '<p></p>',
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none min-h-[360px] px-5 py-5 focus:outline-none text-slate-800',
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
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

  if (!editor) return null

  return (
    <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
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
                    {finalContent.trim() ? <div dangerouslySetInnerHTML={{ __html: finalContent }} /> : <p className="italic text-slate-400">Conteúdo vazio...</p>}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <aside className="flex flex-col gap-5 bg-slate-50 px-5 py-5">
          <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Assistente IA</div>
            <div className="mt-2 text-sm text-slate-600">Use a IA para começar um texto do zero ou refinar o conteúdo atual do editor.</div>
            <div className="mt-4 grid gap-2">
              <button onClick={() => onGenerateAI?.({ mode: 'suggest' })} disabled={!onGenerateAI || !!aiLoading} className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60">
                {aiLoading === 'suggest' ? 'Gerando texto...' : 'Gerar sugestão com IA'}
              </button>
              <button onClick={() => onGenerateAI?.({ mode: 'rewrite' })} disabled={!onGenerateAI || !!aiLoading || !content.trim()} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60">
                {aiLoading === 'rewrite' ? 'Reescrevendo...' : 'Reescrever texto atual'}
              </button>
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
