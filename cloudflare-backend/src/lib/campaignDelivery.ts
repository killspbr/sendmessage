import { ensureAbsoluteUrl, htmlToWhatsapp, resolveTemplate, toEvolutionNumber } from './messageUtils'

const MAX_MEDIA_ITEMS = 5
const INTRA_CONTACT_DELAY_MS = 1000
const EVOLUTION_MEDIA_RETRY_ATTEMPTS = 3
const EVOLUTION_MEDIA_RETRY_DELAYS_MS = [1500, 3000]
const ALLOWED_MEDIA_TYPES = new Set(['image', 'document', 'audio'])

type Contact = Record<string, unknown>
type Campaign = Record<string, unknown>
type MediaItem = {
  id: string
  sourceType: 'url' | 'asset'
  mediaType: 'image' | 'document' | 'audio'
  url: string
  caption: string
  assetId?: string
  assetName?: string
  mimeType?: string
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function safeTrim(value: unknown) {
  return String(value || '').trim()
}

function isValidHttpUrl(value: unknown) {
  try {
    const url = new URL(String(value || '').trim())
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function ensureHtmlMessage(message: unknown) {
  const raw = safeTrim(message)
  if (!raw) return ''
  if (raw.startsWith('<')) return raw
  return `<p style="margin:0; font-size:14px; line-height:1.5; color:#111827;">${raw
    .split('\n')
    .map((line) => (line.trim().length === 0 ? '&nbsp;' : line))
    .join('<br />')}</p>`
}

function inferFileNameFromUrl(url: string) {
  try {
    const parsed = new URL(url)
    return safeTrim(decodeURIComponent(parsed.pathname.split('/').pop() || ''))
  } catch {
    return ''
  }
}

function sanitizeFileName(fileName: string, fallback = 'arquivo') {
  const safe = safeTrim(fileName)
    .replace(/[<>:"/\\|?*\x00-\x1F]+/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
  return safe || fallback
}

function inferMimeType(media: MediaItem) {
  const explicit = safeTrim(media.mimeType).toLowerCase()
  if (explicit) return explicit

  const hint = `${safeTrim(media.assetName)} ${inferFileNameFromUrl(media.url)}`.toLowerCase()
  if (hint.endsWith('.pdf')) return 'application/pdf'
  if (hint.endsWith('.pptx')) return 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  if (hint.endsWith('.ppt')) return 'application/vnd.ms-powerpoint'
  if (hint.endsWith('.mp3')) return 'audio/mpeg'
  if (hint.endsWith('.wav')) return 'audio/wav'
  if (hint.endsWith('.mp4')) return 'video/mp4'
  if (hint.endsWith('.png')) return 'image/png'
  if (hint.endsWith('.webp')) return 'image/webp'
  if (hint.endsWith('.jpg') || hint.endsWith('.jpeg')) return 'image/jpeg'
  if (media.mediaType === 'audio') return 'audio/mpeg'
  return media.mediaType === 'document' ? 'application/octet-stream' : 'image/jpeg'
}

function resolveMediaFileName(media: MediaItem) {
  const fromAsset = safeTrim(media.assetName)
  if (fromAsset) return sanitizeFileName(fromAsset)
  const fromUrl = inferFileNameFromUrl(media.url)
  if (fromUrl) return sanitizeFileName(fromUrl)
  return sanitizeFileName(
    `${media.id}${media.mediaType === 'document' ? '.pdf' : media.mediaType === 'audio' ? '.mp3' : '.jpg'}`
  )
}

function normalizeMediaItem(item: any, index: number): MediaItem | null {
  const mediaType = safeTrim(item?.mediaType || 'image').toLowerCase()
  const url = safeTrim(item?.url)
  if (!url || !ALLOWED_MEDIA_TYPES.has(mediaType)) return null

  return {
    id: safeTrim(item?.id) || `media-${index + 1}`,
    sourceType: safeTrim(item?.sourceType).toLowerCase() === 'asset' ? 'asset' : 'url',
    mediaType: mediaType as MediaItem['mediaType'],
    url,
    caption: safeTrim(item?.caption),
    assetId: safeTrim(item?.assetId) || undefined,
    assetName: safeTrim(item?.assetName) || undefined,
    mimeType: safeTrim(item?.mimeType) || undefined,
  }
}

function normalizeSharedContact(contact: any) {
  if (!contact || typeof contact !== 'object') return null
  const fullName = safeTrim(contact.fullName)
  const phone = safeTrim(contact.phone)
  const company = safeTrim(contact.company)
  const email = safeTrim(contact.email)
  const url = safeTrim(contact.url)
  if (!fullName && !phone && !company && !email && !url) return null
  return { fullName, phone, company, email, url }
}

export function parseCampaignDeliveryPayload(rawPayload: unknown) {
  if (!rawPayload) return null

  try {
    const parsed = typeof rawPayload === 'string' ? JSON.parse(rawPayload) : rawPayload
    if (!parsed || typeof parsed !== 'object') return null

    const blocks = Array.isArray((parsed as any)?.whatsapp?.blocks) ? (parsed as any).whatsapp.blocks : []
    const normalizedBlocks: any[] = []

    for (const block of blocks) {
      const type = safeTrim(block?.type).toLowerCase()
      if (type === 'text') {
        const content = String(block?.content || '')
        if (content.trim()) normalizedBlocks.push({ type: 'text', content })
      } else if (type === 'media') {
        const items = Array.isArray(block?.items)
          ? block.items.map((item: any, index: number) => normalizeMediaItem(item, index)).filter(Boolean).slice(0, MAX_MEDIA_ITEMS)
          : []
        if (items.length > 0) normalizedBlocks.push({ type: 'media', items })
      } else if (type === 'contact') {
        const contact = normalizeSharedContact(block?.contact)
        if (contact) normalizedBlocks.push({ type: 'contact', contact })
      }
    }

    if (normalizedBlocks.length === 0) return null
    return { version: Number((parsed as any)?.version || 1), whatsapp: { blocks: normalizedBlocks } }
  } catch {
    return null
  }
}

export function validateCampaignDeliveryPayload(rawPayload: unknown, channels: string[] = []) {
  const errors: string[] = []
  if (rawPayload == null) return { payload: null, errors }

  const payload = parseCampaignDeliveryPayload(rawPayload)
  if (!payload) return { payload: null, errors: ['O payload estruturado da campanha esta invalido.'] }

  if (channels.includes('whatsapp')) {
    const mediaItems = payload.whatsapp.blocks
      .filter((block: any) => block.type === 'media')
      .flatMap((block: any) => block.items || [])

    if (mediaItems.length > MAX_MEDIA_ITEMS) {
      errors.push(`A campanha suporta no maximo ${MAX_MEDIA_ITEMS} midias por WhatsApp.`)
    }

    for (const media of mediaItems) {
      if (!isValidHttpUrl(media.url)) errors.push(`A midia "${media.id}" precisa usar uma URL publica valida.`)
    }

    const contactBlock = payload.whatsapp.blocks.find((block: any) => block.type === 'contact')
    if (contactBlock?.contact) {
      if (!contactBlock.contact.fullName) errors.push('O contato compartilhado precisa ter nome.')
      if (!contactBlock.contact.phone) errors.push('O contato compartilhado precisa ter telefone.')
    }
  }

  return { payload, errors }
}

function buildCampaignDeliveryPlan(campaign: Campaign, messageOverride?: string) {
  const payload = parseCampaignDeliveryPayload(campaign.delivery_payload)
  const textBlock = payload?.whatsapp?.blocks?.find((block: any) => block.type === 'text')
  const mediaItems =
    payload?.whatsapp?.blocks
      ?.filter((block: any) => block.type === 'media')
      .flatMap((block: any) => block.items || []) ?? []
  const contactBlock = payload?.whatsapp?.blocks?.find((block: any) => block.type === 'contact')

  return {
    payload,
    messageHtml: ensureHtmlMessage(messageOverride || textBlock?.content || campaign.message || ''),
    mediaItems,
    sharedContact: contactBlock?.contact || null,
  }
}

async function postEvolution(fetchImpl: typeof fetch, url: string, apiKey: string, body: unknown) {
  const response = await fetchImpl(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: apiKey },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(text || `HTTP ${response.status}`)
  }
}

function isRetryableEvolutionTransportError(error: unknown) {
  const message = String((error as any)?.message || '').toLowerCase()
  return (
    message.includes('connection closed') ||
    message.includes('socket hang up') ||
    message.includes('econnreset') ||
    message.includes('etimedout') ||
    message.includes('fetch failed') ||
    message.includes('und_err_socket')
  )
}

async function postEvolutionWithRetry(fetchImpl: typeof fetch, url: string, apiKey: string, body: unknown) {
  let lastError: unknown = null
  for (let attempt = 1; attempt <= EVOLUTION_MEDIA_RETRY_ATTEMPTS; attempt++) {
    try {
      await postEvolution(fetchImpl, url, apiKey, body)
      return
    } catch (error) {
      lastError = error
      const canRetry = attempt < EVOLUTION_MEDIA_RETRY_ATTEMPTS && isRetryableEvolutionTransportError(error)
      if (!canRetry) throw error
      const delay = EVOLUTION_MEDIA_RETRY_DELAYS_MS[Math.min(attempt - 1, EVOLUTION_MEDIA_RETRY_DELAYS_MS.length - 1)]
      await wait(delay)
    }
  }
  throw lastError
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer)
  const chunkSize = 0x8000
  let binary = ''
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize)
    binary += String.fromCharCode(...chunk)
  }
  return btoa(binary)
}

async function resolveMediaBody(fetchImpl: typeof fetch, media: MediaItem, resolvedUrl: string, baseUrl?: string) {
  if (media.sourceType !== 'asset' || media.mediaType === 'document') {
    return baseUrl ? ensureAbsoluteUrl(resolvedUrl, baseUrl) : resolvedUrl
  }

  const response = await fetchImpl(resolvedUrl)
  if (!response.ok) {
    throw new Error(`Falha ao carregar o arquivo do servidor (${response.status}): ${await response.text().catch(() => 'corpo indisponivel')}`)
  }
  return arrayBufferToBase64(await response.arrayBuffer())
}

function buildMediaCaption(messageText: string, mediaCaption: string, attachMessage: boolean) {
  const parts: string[] = []
  if (attachMessage && safeTrim(messageText)) parts.push(safeTrim(messageText))
  if (safeTrim(mediaCaption)) parts.push(safeTrim(mediaCaption))
  return parts.join('\n\n').trim()
}

async function sendEvolutionMedia({
  fetchImpl,
  evolutionUrl,
  evolutionApiKey,
  evolutionInstance,
  number,
  media,
  resolvedUrl,
  caption,
  baseUrl,
}: {
  fetchImpl: typeof fetch
  evolutionUrl: string
  evolutionApiKey: string
  evolutionInstance: string
  number: string
  media: MediaItem
  resolvedUrl: string
  caption: string
  baseUrl?: string
}) {
  const mediaBody = await resolveMediaBody(fetchImpl, media, resolvedUrl, baseUrl)
  const fileName = resolveMediaFileName(media)
  const mimeType = inferMimeType(media)

  const legacyPayload = {
    number,
    mediatype: media.mediaType,
    mimetype: mimeType,
    fileName,
    caption,
    media: mediaBody,
  }

  await postEvolutionWithRetry(fetchImpl, `${evolutionUrl}/message/sendMedia/${evolutionInstance}`, evolutionApiKey, legacyPayload)
}

async function sendEvolutionAudio({
  fetchImpl,
  evolutionUrl,
  evolutionApiKey,
  evolutionInstance,
  number,
  media,
  resolvedUrl,
  baseUrl,
}: {
  fetchImpl: typeof fetch
  evolutionUrl: string
  evolutionApiKey: string
  evolutionInstance: string
  number: string
  media: MediaItem
  resolvedUrl: string
  baseUrl?: string
}) {
  const audioBody = await resolveMediaBody(fetchImpl, media, resolvedUrl, baseUrl)
  await postEvolutionWithRetry(fetchImpl, `${evolutionUrl}/message/sendWhatsAppAudio/${evolutionInstance}`, evolutionApiKey, {
    number,
    audio: audioBody,
  })
}

function resolveSharedContact(sharedContact: any, contact: Contact) {
  if (!sharedContact) return null
  const fullName = safeTrim(resolveTemplate(sharedContact.fullName, contact))
  const phone = safeTrim(resolveTemplate(sharedContact.phone, contact))
  const company = safeTrim(resolveTemplate(sharedContact.company || '', contact))
  const email = safeTrim(resolveTemplate(sharedContact.email || '', contact))
  const url = safeTrim(resolveTemplate(sharedContact.url || '', contact))
  if (!fullName || !phone) return null
  return { fullName, phone, company, email, url }
}

async function sendEvolutionContact({
  fetchImpl,
  evolutionUrl,
  evolutionApiKey,
  evolutionInstance,
  number,
  sharedContact,
}: {
  fetchImpl: typeof fetch
  evolutionUrl: string
  evolutionApiKey: string
  evolutionInstance: string
  number: string
  sharedContact: { fullName: string; phone: string; company?: string; email?: string; url?: string }
}) {
  const contactNumber = toEvolutionNumber(sharedContact.phone)
  if (!contactNumber) throw new Error('Telefone do contato compartilhado esta invalido.')

  const payload = {
    wuid: `${contactNumber}@s.whatsapp.net`,
    phoneNumber: contactNumber,
    fullName: sharedContact.fullName,
    organization: sharedContact.company || undefined,
    email: sharedContact.email || undefined,
    url: sharedContact.url || undefined,
  }

  await postEvolution(fetchImpl, `${evolutionUrl}/message/sendContact/${evolutionInstance}`, evolutionApiKey, {
    number,
    contact: [payload],
  })
}

export async function executeWhatsappCampaignDelivery({
  fetchImpl = fetch,
  evolutionUrl,
  evolutionApiKey,
  evolutionInstance,
  campaign,
  contact,
  messageOverride,
  baseUrl,
}: {
  fetchImpl?: typeof fetch
  evolutionUrl: string
  evolutionApiKey: string
  evolutionInstance: string
  campaign: Campaign
  contact: Contact
  messageOverride?: string
  baseUrl?: string
}) {
  const evolutionNumber = toEvolutionNumber(contact.phone)
  if (!evolutionNumber) throw new Error('Contato sem telefone valido para envio no formato Evolution.')

  const plan = buildCampaignDeliveryPlan(campaign, messageOverride)
  const resolvedHtml = resolveTemplate(plan.messageHtml, contact)
  const messageText = htmlToWhatsapp(resolvedHtml)

  const result = {
    sentText: false,
    mediaSent: 0,
    mediaFailed: 0,
    contactSent: false,
    contactFailed: false,
    errors: [] as string[],
  }

  const mediaItems = Array.isArray(plan.mediaItems) ? plan.mediaItems : []
  const [firstMedia, ...remainingMedia] = mediaItems
  const useMessageAsFirstMediaCaption = Boolean(messageText && firstMedia && firstMedia.mediaType === 'image')

  const sendMediaItem = async (media: MediaItem, attachMessage: boolean) => {
    const resolvedUrl = safeTrim(resolveTemplate(media.url, contact))
    if (!isValidHttpUrl(resolvedUrl)) {
      result.mediaFailed += 1
      result.errors.push(`Midia invalida ignorada: ${media.id}`)
      return
    }

    try {
      if (media.mediaType === 'audio') {
        await sendEvolutionAudio({
          fetchImpl,
          evolutionUrl,
          evolutionApiKey,
          evolutionInstance,
          number: evolutionNumber,
          media,
          resolvedUrl,
          baseUrl,
        })
      } else {
        await sendEvolutionMedia({
          fetchImpl,
          evolutionUrl,
          evolutionApiKey,
          evolutionInstance,
          number: evolutionNumber,
          media,
          resolvedUrl,
          caption: buildMediaCaption(
            messageText,
            safeTrim(resolveTemplate(media.caption || '', contact)),
            attachMessage
          ),
          baseUrl,
        })
      }
      result.mediaSent += 1
      if (attachMessage) result.sentText = true
    } catch (error) {
      result.mediaFailed += 1
      result.errors.push(`Falha ao enviar midia ${media.id}: ${String((error as any)?.message || error)}`)
    }
  }

  if (firstMedia) {
    await sendMediaItem(firstMedia, useMessageAsFirstMediaCaption)
    if (remainingMedia.length > 0 || (messageText && !useMessageAsFirstMediaCaption) || plan.sharedContact) {
      await wait(INTRA_CONTACT_DELAY_MS)
    }
  }

  if (messageText && !useMessageAsFirstMediaCaption) {
    await postEvolution(fetchImpl, `${evolutionUrl}/message/sendText/${evolutionInstance}`, evolutionApiKey, {
      number: evolutionNumber,
      text: messageText,
      linkPreview: true,
    })
    result.sentText = true
    if (remainingMedia.length > 0 || plan.sharedContact) await wait(INTRA_CONTACT_DELAY_MS)
  }

  for (let i = 0; i < remainingMedia.length; i++) {
    await sendMediaItem(remainingMedia[i], false)
    if (i < remainingMedia.length - 1 || plan.sharedContact) await wait(INTRA_CONTACT_DELAY_MS)
  }

  if (plan.sharedContact) {
    const resolvedShared = resolveSharedContact(plan.sharedContact, contact)
    if (!resolvedShared) {
      result.contactFailed = true
      result.errors.push('Contato compartilhado invalido ou incompleto.')
    } else {
      try {
        await sendEvolutionContact({
          fetchImpl,
          evolutionUrl,
          evolutionApiKey,
          evolutionInstance,
          number: evolutionNumber,
          sharedContact: resolvedShared,
        })
        result.contactSent = true
      } catch (error) {
        result.contactFailed = true
        result.errors.push(`Falha ao enviar contato compartilhado: ${String((error as any)?.message || error)}`)
      }
    }
  }

  return result
}

