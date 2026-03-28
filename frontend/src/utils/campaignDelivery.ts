import type { Campaign, CampaignChannel, CampaignDeliveryPayload, CampaignMediaItem, CampaignSharedContact } from '../types'

type WhatsappBlock = NonNullable<CampaignDeliveryPayload['whatsapp']>['blocks'][number]

export function createEmptySharedContact(): CampaignSharedContact {
  return {
    fullName: '',
    phone: '',
    company: '',
    email: '',
    url: '',
  }
}

export function createEmptyMediaItem(): CampaignMediaItem {
  return {
    id: `media-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    sourceType: 'url',
    mediaType: 'image',
    url: '',
    caption: '',
  }
}

function normalizeMediaItems(items: CampaignMediaItem[]) {
  return items
    .map((item) => ({
      id: String(item.id || '').trim() || `media-${Math.random().toString(36).slice(2, 8)}`,
      sourceType: 'url' as const,
      mediaType: (item.mediaType === 'document' ? 'document' : 'image') as CampaignMediaItem['mediaType'],
      url: String(item.url || '').trim(),
      caption: String(item.caption || '').trim(),
    }))
    .filter((item) => item.url)
}

function normalizeSharedContact(sharedContact: CampaignSharedContact | null) {
  if (!sharedContact) return null

  const normalized = {
    fullName: String(sharedContact.fullName || '').trim(),
    phone: String(sharedContact.phone || '').trim(),
    company: String(sharedContact.company || '').trim(),
    email: String(sharedContact.email || '').trim(),
    url: String(sharedContact.url || '').trim(),
  }

  const hasData = Object.values(normalized).some(Boolean)
  return hasData ? normalized : null
}

export function buildCampaignDeliveryPayload({
  channels,
  message,
  mediaItems,
  sharedContact,
}: {
  channels: CampaignChannel[]
  message: string
  mediaItems: CampaignMediaItem[]
  sharedContact: CampaignSharedContact | null
}): CampaignDeliveryPayload | null {
  if (!channels.includes('whatsapp')) {
    return null
  }

  const blocks: WhatsappBlock[] = []
  const textContent = String(message || '').trim()

  if (textContent) {
    blocks.push({ type: 'text', content: message })
  }

  const normalizedMediaItems = normalizeMediaItems(mediaItems)
  if (normalizedMediaItems.length > 0) {
    blocks.push({ type: 'media', items: normalizedMediaItems })
  }

  const normalizedSharedContact = normalizeSharedContact(sharedContact)
  if (normalizedSharedContact) {
    blocks.push({ type: 'contact', contact: normalizedSharedContact })
  }

  return blocks.length > 0
    ? {
        version: 1,
        whatsapp: { blocks },
      }
    : null
}

export function extractCampaignDeliveryState(campaign: Campaign): {
  mediaItems: CampaignMediaItem[]
  sharedContact: CampaignSharedContact | null
} {
  const blocks = campaign.deliveryPayload?.whatsapp?.blocks ?? []
  const mediaItems = blocks
    .filter((block): block is { type: 'media'; items: CampaignMediaItem[] } => block.type === 'media')
    .flatMap((block) => block.items || [])
    .map<CampaignMediaItem>((item) => ({
      id: item.id,
      sourceType: 'url' as const,
      mediaType: item.mediaType === 'document' ? 'document' : 'image',
      url: item.url || '',
      caption: item.caption || '',
    }))

  const contactBlock = blocks.find(
    (block): block is { type: 'contact'; contact: CampaignSharedContact } => block.type === 'contact'
  )

  return {
    mediaItems,
    sharedContact: contactBlock?.contact
      ? {
          fullName: contactBlock.contact.fullName || '',
          phone: contactBlock.contact.phone || '',
          company: contactBlock.contact.company || '',
          email: contactBlock.contact.email || '',
          url: contactBlock.contact.url || '',
        }
      : null,
  }
}
