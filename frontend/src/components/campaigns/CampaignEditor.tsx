import { useEffect, useState, useMemo } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import Image from '@tiptap/extension-image'
import type { CampaignChannel } from '../../types'

type CampaignEditorProps = {
  content: string
  onChange: (html: string) => void
  onGenerateAI?: (options: { mode: 'suggest' | 'rewrite' }) => Promise<void>
  aiLoading: 'suggest' | 'rewrite' | null
  channels: CampaignChannel[]
  htmlToWhatsapp: (html: string) => string
}

const variables = [
  { label: 'Nome Completo', value: '{name}', icon: '👤' },
  { label: 'Primeiro Nome', value: '{primeiro_nome}', icon: '👤' },
  { label: 'Telefone', value: '{phone}', icon: '📱' },
  { label: 'Categoria', value: '{category}', icon: '🏷️' },
  { label: 'Cidade', value: '{city}', icon: '🏙️' },
  { label: 'Email', value: '{email}', icon: '📧' },
  { label: 'Avaliação', value: '{rating}', icon: '⭐' },
]

const testData = {
  '{name}': 'João Silva',
  '{primeiro_nome}': 'João',
  '{phone}': '(11) 99999-9999',
  '{category}': 'Cliente VIP',
  '{city}': 'São Paulo',
  '{email}': 'joao@exemplo.com.br',
  '{rating}': '⭐⭐⭐⭐⭐',
}

const resolveTemplate = (tpl: string, data: Record<string, string>) => {
  let result = tpl
  Object.entries(data).forEach(([key, val]) => {
    // Usar regex global para substituir todas as ocorrências
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    result = result.replace(new RegExp(escapedKey, 'g'), val)
  })
  return result
}

// Mover extensões para fora do componente para evitar re-criação e avisos de duplicidade
// Filtramos duplicados por nome para evitar o aviso do Tiptap v3
const EDITOR_EXTENSIONS = [
  StarterKit.configure({
    link: false,
    underline: false,
  }),
  Underline,
  Link.configure({
    openOnClick: false,
    HTMLAttributes: {
      class: 'text-emerald-600 underline',
    },
  }),
  TextAlign.configure({ types: ['heading', 'paragraph'] }),
  Image.configure({
    HTMLAttributes: {
      class: 'rounded-lg max-w-full h-auto shadow-md my-4',
    },
  }),
]

export function CampaignEditor({
  content,
  onChange,
  onGenerateAI,
  aiLoading,
  channels,
  htmlToWhatsapp,
}: CampaignEditorProps) {
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor')
  const [useTestData, setUseTestData] = useState(false)

  const editor = useEditor({
    extensions: EDITOR_EXTENSIONS,
    content: content || '<p></p>',
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose focus:outline-none max-w-none min-h-[300px] p-4 text-slate-700',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  // Sincroniza conteúdo externo para o editor se necessário
  useEffect(() => {
    if (!editor) return
    const currentHtml = editor.getHTML()
    if (content !== currentHtml) {
      editor.commands.setContent(content || '<p></p>')
    }
  }, [content, editor])

  const charCount = useMemo(() => {
    if (!editor) return 0
    return editor.getText().length
  }, [content, editor])

  const finalContent = useMemo(() => {
    return useTestData ? resolveTemplate(content, testData) : content
  }, [content, useTestData])

  const whatsappText = useMemo(() => htmlToWhatsapp(finalContent), [finalContent, htmlToWhatsapp])

  const insertVariable = (val: string) => {
    if (editor) {
      editor.chain().focus().insertContent(val).run()
    }
  }

  if (!editor) return null

  return (
    <div className="flex flex-col border border-slate-200 rounded-2xl bg-white shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
      {/* Header / Tabs */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-4">
          <div className="flex bg-slate-200/50 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('editor')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === 'editor'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              Editor
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === 'preview'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              Pré-visualização
            </button>
          </div>

          {activeTab === 'preview' && (
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={useTestData}
                  onChange={(e) => setUseTestData(e.target.checked)}
                />
                <div className={`block w-8 h-4 rounded-full transition-colors ${useTestData ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                <div className={`absolute left-0.5 top-0.5 bg-white w-3 h-3 rounded-full transition-transform ${useTestData ? 'translate-x-4' : ''}`} />
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight group-hover:text-slate-700 transition-colors">Ver com dados reais</span>
            </label>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onGenerateAI && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onGenerateAI({ mode: 'suggest' })}
                disabled={!!aiLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100 transition-all disabled:opacity-50"
              >
                {aiLoading === 'suggest' ? (
                  <span className="animate-pulse">Gerando...</span>
                ) : (
                  <>
                    <span>✨ Suggest</span>
                  </>
                )}
              </button>
              <button
                onClick={() => onGenerateAI({ mode: 'rewrite' })}
                disabled={!!aiLoading || !content.trim()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition-all disabled:opacity-50"
              >
                {aiLoading === 'rewrite' ? (
                  <span className="animate-pulse">Reescrevendo...</span>
                ) : (
                  <>
                    <span>✍️ Rewrite</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {activeTab === 'editor' ? (
        <>
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-1 p-2 border-b border-slate-50 bg-white">
            <div className="flex items-center gap-0.5 mr-2">
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${editor.isActive('bold') ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                title="Bold (Ctrl+B)"
              >
                <span className="font-bold">B</span>
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${editor.isActive('italic') ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                title="Italic (Ctrl+I)"
              >
                <span className="italic serif text-lg">I</span>
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${editor.isActive('underline') ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                title="Underline (Ctrl+U)"
              >
                <span className="underline decoration-2">U</span>
              </button>
            </div>

            <div className="w-px h-6 bg-slate-200 mx-1" />

            <div className="flex items-center gap-0.5 mx-2">
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${editor.isActive('bulletList') ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                title="Bullet List"
              >
                <span>•</span>
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${editor.isActive('orderedList') ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                title="Numbered List"
              >
                <span className="text-[10px]">1.</span>
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${editor.isActive('blockquote') ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                title="Quote"
              >
                <span className="text-sm">"</span>
              </button>
            </div>

            <div className="w-px h-6 bg-slate-200 mx-1" />

            <div className="flex items-center gap-0.5 mx-2">
              <button
                type="button"
                onClick={() => editor.chain().focus().setTextAlign('left').run()}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${editor.isActive({ textAlign: 'left' }) ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                  }`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 12H3" /><path d="M19 18H3" /><path d="M21 6H3" /></svg>
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().setTextAlign('center').run()}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${editor.isActive({ textAlign: 'center' }) ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                  }`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 12H6" /><path d="M21 18H3" /><path d="M21 6H3" /></svg>
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().setTextAlign('right').run()}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${editor.isActive({ textAlign: 'right' }) ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                  }`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12H7" /><path d="M21 18H3" /><path d="M21 6H3" /></svg>
              </button>
            </div>

            <div className="w-px h-6 bg-slate-200 mx-1" />

            <div className="flex items-center gap-0.5 mx-2">
              <button
                type="button"
                title="Insert Link"
                onClick={() => {
                  const url = window.prompt('URL do link:')
                  if (url) editor.chain().focus().setLink({ href: url }).run()
                  else editor.chain().focus().unsetLink().run()
                }}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${editor.isActive('link') ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                  }`}
              >
                <span className="text-sm">🔗</span>
              </button>
              <button
                type="button"
                title="Insert Image"
                onClick={() => {
                  const url = window.prompt('URL da imagem:')
                  if (url) editor.chain().focus().setImage({ src: url }).run()
                }}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-all font-bold"
              >
                <span className="text-sm">🖼️</span>
              </button>
            </div>

            <div className="flex-1" />

            {/* Inserir Variáveis */}
            <div className="relative group">
              <button
                type="button"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-[11px] font-bold text-slate-700 hover:bg-slate-50 transition-all"
              >
                <span>➕ Variáveis</span>
              </button>
              <div className="absolute right-0 bottom-full mb-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
                <div className="p-2 bg-slate-50 border-b border-slate-100">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Inserir no texto</span>
                </div>
                {variables.map((v) => (
                  <button
                    key={v.value}
                    onClick={() => insertVariable(v.value)}
                    className="w-full flex items-center gap-3 px-3 py-2 text-[11px] text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors border-b last:border-0 border-slate-50"
                  >
                    <span className="text-xs">{v.icon}</span>
                    <span className="font-medium">{v.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Area do Editor */}
          <div className="relative bg-white min-h-[350px]">
            <EditorContent editor={editor} />

            {/* Char Counter Floating */}
            <div className="absolute bottom-3 right-4 px-2 py-1 bg-slate-100/80 backdrop-blur-sm rounded-md border border-slate-200 pointer-events-none">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{charCount} caracteres</span>
            </div>
          </div>
        </>
      ) : (
        /* Preview Area */
        <div className="bg-slate-50 p-6 min-h-[415px] flex flex-col gap-6 items-center">
          {channels.includes('whatsapp') && (
            <div className="flex flex-col gap-2 w-full max-w-[400px]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Visualização WhatsApp</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">Simulado</span>
              </div>
              <div className="relative bg-[#e5ddd5] rounded-2xl shadow-xl overflow-hidden min-h-[250px] p-4 flex flex-col gap-4 border border-slate-200">
                {/* Chat Background pattern mimic */}
                <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

                {/* WhatsApp Bubble */}
                <div className="relative self-start max-w-[85%] bg-white rounded-tr-xl rounded-b-xl px-3 py-2 shadow-sm border border-slate-200/50">
                  <div className="text-xs text-slate-800 whitespace-pre-wrap break-words leading-relaxed">
                    {whatsappText || <span className="text-slate-400 italic">Mensagem vazia...</span>}
                  </div>
                  <div className="text-[9px] text-slate-400 text-right mt-1">
                    {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  {/* Bubble tail */}
                  <svg className="absolute top-0 -left-2 text-white h-4 w-4" preserveAspectRatio="none" viewBox="0 0 10 10"><path fill="currentColor" d="M10 0 L10 10 L0 0 Z" /></svg>
                </div>

                <div className="mt-auto self-center bg-white/50 backdrop-blur-sm rounded-full px-4 py-1 border border-white/20">
                  <span className="text-[9px] font-medium text-slate-500 italic">
                    {useTestData ? 'Simulando com dados reais' : 'As variáveis (ex: {name}) serão substituídas no envio real'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {channels.includes('email') && (
            <div className="flex flex-col gap-2 w-full max-w-2xl bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Visualização E-mail</span>
              <div className="prose prose-sm max-w-none text-slate-800">
                {finalContent.trim() ? (
                  <div dangerouslySetInnerHTML={{ __html: finalContent }} />
                ) : (
                  <p className="text-slate-400 italic">Conteúdo do e-mail vazio...</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer / Shortcuts Help */}
      <div className="p-2 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
        <div className="flex gap-4">
          <span className="text-[9px] text-slate-400 font-medium">Ctrl + B (Negrito)</span>
          <span className="text-[9px] text-slate-400 font-medium">Ctrl + I (Itálico)</span>
          <span className="text-[9px] text-slate-400 font-medium">Ctrl + U (Sublinhado)</span>
        </div>
        <div className="text-[9px] text-slate-400 italic">
          O editor utiliza Tiptap para formatação rica
        </div>
      </div>
    </div>
  )
}
