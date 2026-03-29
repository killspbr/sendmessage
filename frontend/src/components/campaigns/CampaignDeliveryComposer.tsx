import { useRef, useState } from 'react'
import { apiUpload, API_URL } from '../../api'
import type {
  CampaignChannel,
  CampaignMediaItem,
  CampaignSharedContact,
  UploadedUserFile,
} from '../../types'
import { createEmptyMediaItem, createEmptySharedContact } from '../../utils/campaignDelivery'
import { normalizeDisplayText } from '../../utils/textEncoding'
import { MediaManager } from '../media/MediaManager'

type CampaignDeliveryComposerProps = {
  channels: CampaignChannel[]
  mediaItems: CampaignMediaItem[]
  sharedContact: CampaignSharedContact | null
  onChangeMediaItems: (items: CampaignMediaItem[]) => void
  onChangeSharedContact: (contact: CampaignSharedContact | null) => void
}

const MAX_UPLOAD_SIZE_BYTES = 50 * 1024 * 1024

export function CampaignDeliveryComposer({
  channels,
  mediaItems,
  sharedContact,
  onChangeMediaItems,
  onChangeSharedContact,
}: CampaignDeliveryComposerProps) {
  const whatsappEnabled = channels.includes('whatsapp')
  const [isLibraryOpen, setIsLibraryOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [libraryMessage, setLibraryMessage] = useState<string | null>(null)
  
  const uploadInputRef = useRef<HTMLInputElement | null>(null)

  const updateMediaItem = (id: string, patch: Partial<CampaignMediaItem>) => {
    onChangeMediaItems(
      mediaItems.map((item) => (item.id === id ? { ...item, ...patch } : item))
    )
  }

  const removeMediaItem = (id: string) => {
    onChangeMediaItems(mediaItems.filter((item) => item.id !== id))
  }

  const handleLibrarySelect = (selectedFiles: UploadedUserFile[]) => {
    const newItems = selectedFiles.map(file => ({
      ...createEmptyMediaItem(),
      sourceType: 'asset' as const,
      mediaType: file.mediaType,
      url: file.publicUrl.startsWith('http') ? file.publicUrl : `${API_URL}${file.publicUrl}`,
      assetId: file.id,
      assetName: normalizeDisplayText(file.originalName),
      mimeType: file.mimeType,
      sizeBytes: file.sizeBytes,
    }))
    
    onChangeMediaItems([...mediaItems, ...newItems])
    setIsLibraryOpen(false)
  }

  const handleUploadFiles = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || [])
    event.target.value = ''

    if (selectedFiles.length === 0) return

    const oversizedFile = selectedFiles.find((file) => file.size > MAX_UPLOAD_SIZE_BYTES)
    if (oversizedFile) {
      setLibraryMessage(`O arquivo "${oversizedFile.name}" excede o limite de 50 MB.`)
      return
    }

    setUploading(true)
    setUploadProgress(0)
    setLibraryMessage(null)

    try {
      const form = new FormData()
      selectedFiles.forEach((file) => form.append('files', file))

      const response = await apiUpload('/api/files/upload', form, {
        onProgress: ({ percent }) => setUploadProgress(percent),
      })

      const incoming = Array.isArray(response) ? response : response ? [response] : []
      handleLibrarySelect(incoming)
      
      setLibraryMessage(`${incoming.length} arquivo(s) enviados e adicionados à campanha.`)
    } catch (error: any) {
      setLibraryMessage(error?.message || 'Falha ao enviar o arquivo.')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const shared = sharedContact ?? createEmptySharedContact()

  if (!whatsappEnabled) return null

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50">
        <input
          ref={uploadInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleUploadFiles}
        />

        <div className="flex items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Mídias da Campanha</h3>
            <p className="mt-1 text-xs text-slate-400">Anexe imagens, áudios ou documentos para o envio.</p>
          </div>
          <div className="flex gap-2">
             <button
              type="button"
              onClick={() => setIsLibraryOpen(true)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-sm transition-all"
            >
              📚 Biblioteca
            </button>
            <button
              type="button"
              onClick={() => onChangeMediaItems([...mediaItems, createEmptyMediaItem()])}
              className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 shadow-md shadow-slate-200"
            >
              + Avulso
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {mediaItems.length === 0 ? (
            <div 
               onClick={() => setIsLibraryOpen(true)}
               className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/50 py-10 transition hover:bg-slate-50"
            >
               <div className="text-3xl mb-2 opacity-30">☁️</div>
               <p className="text-sm font-medium text-slate-500">Nenhum anexo configurado.</p>
               <p className="mt-1 text-xs text-slate-400">Clique para abrir sua biblioteca ou selecione arquivos.</p>
            </div>
          ) : (
            mediaItems.map((item, index) => (
              <div key={item.id} className="relative rounded-2xl border border-slate-100 bg-white p-4 shadow-sm ring-1 ring-slate-900/5 hover:ring-slate-900/10 transition-all">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white">
                      {index + 1}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
                      {item.assetName ? normalizeDisplayText(item.assetName) : 'Anexo sem título'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeMediaItem(item.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                  >
                    🗑️
                  </button>
                </div>

                <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
                   <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tipo de Mídia</span>
                      <select
                        value={item.mediaType}
                        onChange={(e) => updateMediaItem(item.id, { 
                          mediaType: e.target.value as any,
                          url: '',
                          assetId: undefined,
                          assetName: undefined
                        })}
                        className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700 focus:border-blue-500 outline-none"
                      >
                        <option value="image">🖼️ Imagem</option>
                        <option value="document">📄 Documento</option>
                        <option value="audio">🎵 Áudio</option>
                      </select>
                   </div>
                   
                   <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Origem do Arquivo</span>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={item.url}
                          onChange={(e) => updateMediaItem(item.id, { url: e.target.value, sourceType: 'url', assetId: undefined })}
                          placeholder="https://..."
                          readOnly={item.sourceType === 'asset'}
                          className={`h-10 flex-1 rounded-xl border border-slate-200 px-4 text-sm outline-none transition-all ${
                            item.sourceType === 'asset' ? 'bg-emerald-50 text-emerald-800 border-emerald-100 font-medium' : 'bg-white focus:border-blue-500'
                          }`}
                        />
                        {item.sourceType !== 'asset' && (
                          <button 
                            type="button"
                            onClick={() => setIsLibraryOpen(true)}
                            className="flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-3 hover:bg-slate-100 transition-colors"
                            title="Trocar por arquivo da biblioteca"
                          >
                            📂
                          </button>
                        )}
                      </div>
                   </div>
                </div>

                <div className="mt-4 flex flex-col gap-1.5">
                   <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Legenda (Opcional)</span>
                   <input
                      type="text"
                      value={item.caption || ''}
                      onChange={(e) => updateMediaItem(item.id, { caption: e.target.value })}
                      placeholder="Texto que acompanha a mídia..."
                      className="h-10 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-blue-500"
                   />
                </div>
              </div>
            ))
          )}
        </div>

        {uploading && (
          <div className="mt-4 rounded-2xl bg-slate-900 p-4 text-white shadow-lg overflow-hidden relative">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest">
              <span>🚀 Preparando mídias</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div 
                className="h-full bg-emerald-400 transition-all duration-300" 
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}
        
        {libraryMessage && (
           <div className="mt-3 rounded-xl bg-orange-50 p-3 text-xs text-orange-700 font-medium border border-orange-100">
             ⚠️ {libraryMessage}
           </div>
        )}
      </section>

      {/* Seção de Contato Compartilhado */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50">
        <div className="flex items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Cartão de Contato</h3>
            <p className="mt-1 text-xs text-slate-400">Envie um contato do WhatsApp VCard após as mídias.</p>
          </div>
          <button 
            type="button"
            onClick={() => onChangeSharedContact(sharedContact ? null : createEmptySharedContact())}
            className={`flex h-6 w-11 items-center rounded-full transition-colors ${sharedContact ? 'bg-emerald-500' : 'bg-slate-300'}`}
          >
            <div className={`h-4 w-4 rounded-full bg-white transition-transform ${sharedContact ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        {sharedContact ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5 sm:col-span-2">
               <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Nome VCard</span>
               <input
                 type="text"
                 value={shared.fullName}
                 onChange={(e) => onChangeSharedContact({ ...shared, fullName: e.target.value })}
                 className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-blue-500 transition-all"
               />
            </div>
            <div className="flex flex-col gap-1.5">
               <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Número</span>
               <input
                 type="text"
                 value={shared.phone}
                 onChange={(e) => onChangeSharedContact({ ...shared, phone: e.target.value })}
                 placeholder="119..."
                 className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-blue-500"
               />
            </div>
            <div className="flex flex-col gap-1.5">
               <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Empresa</span>
               <input
                 type="text"
                 value={shared.company}
                 onChange={(e) => onChangeSharedContact({ ...shared, company: e.target.value })}
                 className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-blue-500"
               />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/20 py-10 opacity-60">
             <div className="text-3xl mb-2">📇</div>
             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Contato Desativado</p>
          </div>
        )}
      </section>

      {/* Library Modal */}
      {isLibraryOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-md">
          <div className="relative flex h-[85vh] w-full max-w-6xl flex-col overflow-hidden rounded-[40px] bg-white shadow-2xl animate-in zoom-in-95 duration-200">
             <div className="flex items-center justify-between bg-slate-50/80 px-8 py-6 backdrop-blur-sm border-b border-slate-100">
                <div>
                   <h2 className="text-xl font-bold tracking-tight text-slate-900">Minha Biblioteca de Ativos</h2>
                   <p className="text-xs font-medium text-slate-500">Selecione um ou mais arquivos para anexar ao seu disparo.</p>
                </div>
                <button 
                   type="button"
                   onClick={() => setIsLibraryOpen(false)}
                   className="h-12 w-12 rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all flex items-center justify-center shadow-sm"
                >
                   ✕
                </button>
             </div>
             
             <div className="flex-1 overflow-hidden p-8">
                <MediaManager 
                  allowMultiple 
                  onSelect={handleLibrarySelect} 
                />
             </div>
             
             <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
                <button 
                  type="button"
                  onClick={() => setIsLibraryOpen(false)}
                  className="px-6 py-3 rounded-2xl border border-slate-200 bg-white text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all mr-3"
                >
                  Cancelar
                </button>
                <button 
                   type="button"
                   onClick={() => setIsLibraryOpen(false)}
                   className="px-8 py-3 rounded-2xl bg-blue-600 text-sm font-bold text-white shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
                >
                   Entendido
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  )
}
