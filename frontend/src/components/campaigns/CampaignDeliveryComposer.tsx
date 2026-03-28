import { useEffect, useState } from 'react'
import { apiFetch } from '../../api'
import type {
  CampaignChannel,
  CampaignMediaItem,
  CampaignSharedContact,
  UploadedUserFile,
} from '../../types'
import { createEmptyMediaItem, createEmptySharedContact } from '../../utils/campaignDelivery'

type CampaignDeliveryComposerProps = {
  channels: CampaignChannel[]
  mediaItems: CampaignMediaItem[]
  sharedContact: CampaignSharedContact | null
  onChangeMediaItems: (items: CampaignMediaItem[]) => void
  onChangeSharedContact: (contact: CampaignSharedContact | null) => void
}

export function CampaignDeliveryComposer({
  channels,
  mediaItems,
  sharedContact,
  onChangeMediaItems,
  onChangeSharedContact,
}: CampaignDeliveryComposerProps) {
  const whatsappEnabled = channels.includes('whatsapp')
  const [serverFiles, setServerFiles] = useState<UploadedUserFile[]>([])
  const [filesLoading, setFilesLoading] = useState(false)
  const [pickerOpenForId, setPickerOpenForId] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    const loadFiles = async () => {
      if (!whatsappEnabled) {
        if (mounted) {
          setServerFiles([])
          setFilesLoading(false)
        }
        return
      }

      setFilesLoading(true)
      try {
        const data = await apiFetch('/api/files')
        if (!mounted) return
        setServerFiles(Array.isArray(data) ? data : [])
      } catch {
        if (!mounted) return
        setServerFiles([])
      } finally {
        if (mounted) setFilesLoading(false)
      }
    }

    void loadFiles()

    return () => {
      mounted = false
    }
  }, [whatsappEnabled])

  const updateMediaItem = (id: string, patch: Partial<CampaignMediaItem>) => {
    onChangeMediaItems(
      mediaItems.map((item) => (item.id === id ? { ...item, ...patch } : item))
    )
  }

  const removeMediaItem = (id: string) => {
    onChangeMediaItems(mediaItems.filter((item) => item.id !== id))
  }

  const pickServerFile = (itemId: string, file: UploadedUserFile) => {
    updateMediaItem(itemId, {
      sourceType: 'asset',
      mediaType: file.mediaType,
      url: file.publicUrl,
      assetId: file.id,
      assetName: file.originalName,
      mimeType: file.mimeType,
      sizeBytes: file.sizeBytes,
    })
    setPickerOpenForId(null)
  }

  const shared = sharedContact ?? createEmptySharedContact()

  if (!whatsappEnabled) {
    return null
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Midias do WhatsApp
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Use URL publica ou escolha arquivos da sua biblioteca no servidor.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onChangeMediaItems([...mediaItems, createEmptyMediaItem()])}
            className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
          >
            Adicionar midia
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {mediaItems.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
              Nenhuma midia configurada. Voce pode comecar com texto e anexar arquivos depois.
            </div>
          ) : (
            mediaItems.map((item, index) => {
              const compatibleFiles = serverFiles.filter((file) => file.mediaType === item.mediaType)

              return (
                <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold text-slate-700">Midia {index + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeMediaItem(item.id)}
                      className="text-xs font-semibold text-red-600 hover:text-red-700"
                    >
                      Remover
                    </button>
                  </div>

                  <div className="grid gap-3 md:grid-cols-[120px_1fr]">
                    <label className="flex flex-col gap-1">
                      <span className="text-[11px] font-medium text-slate-600">Tipo</span>
                      <select
                        value={item.mediaType}
                        onChange={(e) =>
                          updateMediaItem(item.id, {
                            mediaType: e.target.value as CampaignMediaItem['mediaType'],
                            sourceType: 'url',
                            assetId: undefined,
                            assetName: undefined,
                            mimeType: undefined,
                            sizeBytes: undefined,
                          })
                        }
                        className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      >
                        <option value="image">Imagem</option>
                        <option value="document">Documento</option>
                      </select>
                    </label>

                    <label className="flex flex-col gap-1">
                      <span className="text-[11px] font-medium text-slate-600">URL publica</span>
                      <input
                        type="url"
                        value={item.url}
                        onChange={(e) =>
                          updateMediaItem(item.id, {
                            url: e.target.value,
                            sourceType: 'url',
                            assetId: undefined,
                            assetName: undefined,
                            mimeType: undefined,
                            sizeBytes: undefined,
                          })
                        }
                        placeholder="https://exemplo.com/arquivo.jpg"
                        className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </label>
                  </div>

                  <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
                          Biblioteca do servidor
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          Escolha um arquivo ja enviado na area Meus arquivos do perfil.
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setPickerOpenForId((current) => (current === item.id ? null : item.id))
                        }
                        className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        {pickerOpenForId === item.id ? 'Fechar biblioteca' : 'Escolher dos meus arquivos'}
                      </button>
                    </div>

                    {item.sourceType === 'asset' && item.assetName ? (
                      <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                        Arquivo selecionado: <span className="font-semibold">{item.assetName}</span>
                      </div>
                    ) : null}

                    {pickerOpenForId === item.id ? (
                      <div className="mt-3 space-y-2">
                        {filesLoading ? (
                          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-500">
                            Carregando arquivos...
                          </div>
                        ) : compatibleFiles.length === 0 ? (
                          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-500">
                            Nenhum arquivo compativel encontrado para este tipo.
                          </div>
                        ) : (
                          compatibleFiles.map((file) => (
                            <button
                              key={file.id}
                              type="button"
                              onClick={() => pickServerFile(item.id, file)}
                              className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-left transition hover:border-emerald-200 hover:bg-emerald-50"
                            >
                              <div className="min-w-0">
                                <div className="truncate text-sm font-semibold text-slate-800">
                                  {file.originalName}
                                </div>
                                <div className="mt-1 truncate text-xs text-slate-500">
                                  {file.mimeType}
                                </div>
                              </div>
                              <span className="ml-3 rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-white">
                                Usar arquivo
                              </span>
                            </button>
                          ))
                        )}
                      </div>
                    ) : null}
                  </div>

                  <label className="mt-3 flex flex-col gap-1">
                    <span className="text-[11px] font-medium text-slate-600">Legenda opcional</span>
                    <input
                      type="text"
                      value={item.caption}
                      onChange={(e) => updateMediaItem(item.id, { caption: e.target.value })}
                      placeholder="Ex: Nosso catalogo atualizado"
                      className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </label>
                </div>
              )
            })
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Contato compartilhado
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Opcionalmente, envie o contato do vendedor ou da empresa depois da campanha.
            </p>
          </div>
          <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700">
            <input
              type="checkbox"
              className="h-4 w-4 accent-emerald-600"
              checked={!!sharedContact}
              onChange={(e) => onChangeSharedContact(e.target.checked ? createEmptySharedContact() : null)}
            />
            Ativar
          </label>
        </div>

        {sharedContact ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="flex flex-col gap-1 md:col-span-2">
              <span className="text-[11px] font-medium text-slate-600">Nome completo</span>
              <input
                type="text"
                value={shared.fullName}
                onChange={(e) => onChangeSharedContact({ ...shared, fullName: e.target.value })}
                className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-medium text-slate-600">Telefone</span>
              <input
                type="text"
                value={shared.phone}
                onChange={(e) => onChangeSharedContact({ ...shared, phone: e.target.value })}
                placeholder="11999999999"
                className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-medium text-slate-600">Empresa</span>
              <input
                type="text"
                value={shared.company}
                onChange={(e) => onChangeSharedContact({ ...shared, company: e.target.value })}
                className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-medium text-slate-600">Email</span>
              <input
                type="email"
                value={shared.email}
                onChange={(e) => onChangeSharedContact({ ...shared, email: e.target.value })}
                className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-medium text-slate-600">Site</span>
              <input
                type="url"
                value={shared.url}
                onChange={(e) => onChangeSharedContact({ ...shared, url: e.target.value })}
                placeholder="https://empresa.com"
                className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </label>
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
            O contato compartilhado fica desativado ate voce marcar a opcao acima.
          </div>
        )}
      </section>
    </div>
  )
}
