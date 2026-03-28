import type { CampaignChannel, CampaignMediaItem, CampaignSharedContact } from '../../types'
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

  if (!whatsappEnabled) {
    return null
  }

  const updateMediaItem = (id: string, patch: Partial<CampaignMediaItem>) => {
    onChangeMediaItems(
      mediaItems.map((item) => (item.id === id ? { ...item, ...patch } : item))
    )
  }

  const removeMediaItem = (id: string) => {
    onChangeMediaItems(mediaItems.filter((item) => item.id !== id))
  }

  const shared = sharedContact ?? createEmptySharedContact()

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Mídias do WhatsApp</h3>
            <p className="mt-1 text-sm text-slate-600">Adicione imagens ou documentos por URL pública para enviar junto com o texto.</p>
          </div>
          <button
            type="button"
            onClick={() => onChangeMediaItems([...mediaItems, createEmptyMediaItem()])}
            className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
          >
            Adicionar mídia
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {mediaItems.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
              Nenhuma mídia configurada. Você pode começar só com texto e adicionar URLs depois.
            </div>
          ) : (
            mediaItems.map((item, index) => (
              <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold text-slate-700">Mídia {index + 1}</span>
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
                      onChange={(e) => updateMediaItem(item.id, { mediaType: e.target.value as CampaignMediaItem['mediaType'] })}
                      className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                      <option value="image">Imagem</option>
                      <option value="document">Documento</option>
                    </select>
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-[11px] font-medium text-slate-600">URL pública</span>
                    <input
                      type="url"
                      value={item.url}
                      onChange={(e) => updateMediaItem(item.id, { url: e.target.value })}
                      placeholder="https://exemplo.com/arquivo.jpg"
                      className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </label>
                </div>
                <label className="mt-3 flex flex-col gap-1">
                  <span className="text-[11px] font-medium text-slate-600">Legenda opcional</span>
                  <input
                    type="text"
                    value={item.caption}
                    onChange={(e) => updateMediaItem(item.id, { caption: e.target.value })}
                    placeholder="Ex: Nosso catálogo atualizado"
                    className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </label>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Contato compartilhado</h3>
            <p className="mt-1 text-sm text-slate-600">Opcionalmente, envie o contato do vendedor ou da empresa depois da campanha.</p>
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
            O contato compartilhado fica desativado até você marcar a opção acima.
          </div>
        )}
      </section>
    </div>
  )
}
