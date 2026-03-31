import { ensureAbsoluteUrl, ensureValidMediaUrl, htmlToWhatsapp, postEvolution, postEvolutionWithRetry, resolveTemplate, toEvolutionNumber, wait } from './messageUtils'
import { resolveMediaUrl, preValidateMediaItems } from './mediaResolver'
import type { ResolvedMedia } from './mediaResolver'

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
  mediaUrl,
  caption,
}: {
  fetchImpl: typeof fetch
  evolutionUrl: string
  evolutionApiKey: string
  evolutionInstance: string
  number: string
  media: MediaItem
  mediaUrl: string
  caption: string
}) {
  const fileName = resolveMediaFileName(media)
  const mimeType = inferMimeType(media)

  // Payload identico ao instanceLab.sendMedia que funciona via Postman
  const payload = {
    number,
    mediatype: media.mediaType,
    mimetype: mimeType,
    fileName,
    caption,
    media: mediaUrl,
  }

  await postEvolutionWithRetry(fetchImpl, `${evolutionUrl}/message/sendMedia/${evolutionInstance}`, evolutionApiKey, payload)
}

async function sendEvolutionAudio({
  fetchImpl,
  evolutionUrl,
  evolutionApiKey,
  evolutionInstance,
  number,
  mediaUrl,
}: {
  fetchImpl: typeof fetch
  evolutionUrl: string
  evolutionApiKey: string
  evolutionInstance: string
  number: string
  mediaUrl: string
}) {
  // Payload identico ao instanceLab.sendAudio
  await postEvolutionWithRetry(fetchImpl, `${evolutionUrl}/message/sendWhatsAppAudio/${evolutionInstance}`, evolutionApiKey, {
    number,
    audio: mediaUrl,
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
  env,
}: {
  fetchImpl?: typeof fetch
  evolutionUrl: string
  evolutionApiKey: string
  evolutionInstance: string
  campaign: Campaign
  contact: Contact
  messageOverride?: string
  baseUrl?: string
  env?: any
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
    mediaDetails: [] as Array<{ id: string; type: string; status: 'sent' | 'failed' | 'skipped'; error?: string }>,
  }

  const mediaItems = Array.isArray(plan.mediaItems) ? plan.mediaItems : []

  // ── PRÉ-VALIDAÇÃO: Resolver todas as mídias ANTES de disparar ──
  const preValidationItems = mediaItems.map(m => ({
    id: m.id,
    url: safeTrim(resolveTemplate(m.url, contact)),
    sourceType: m.sourceType,
    mimeType: inferMimeType(m),
  }))

  console.log(`[Delivery] Pre-validando ${preValidationItems.length} midia(s):`, preValidationItems.map(p => ({
    id: p.id, url: p.url.substring(0, 80), sourceType: p.sourceType,
  })))
  console.log(`[Delivery] env.UPLOADS_BUCKET disponivel: ${!!env?.UPLOADS_BUCKET}, env.db disponivel: ${!!env?.db}`)

  const { valid: validMedia, invalid: invalidMedia } = await preValidateMediaItems(preValidationItems, env)

  console.log(`[Delivery] Resultado: ${validMedia.length} valida(s), ${invalidMedia.length} invalida(s)`)
  if (invalidMedia.length > 0) {
    console.log(`[Delivery] Midias invalidas:`, invalidMedia.map(inv => ({ id: inv.mediaId, error: inv.error })))
  }

  // Registra todas as mídias inválidas imediatamente (sem tentar enviar)
  const resolvedUrlMap = new Map<string, ResolvedMedia>()
  for (const v of validMedia) resolvedUrlMap.set(v.mediaId, v)
  for (const inv of invalidMedia) {
    result.mediaFailed += 1
    result.errors.push(`Mídia ${inv.mediaId}: ${inv.error}`)
    result.mediaDetails.push({ id: inv.mediaId, type: 'media', status: 'skipped', error: inv.error })
  }

  // Filtra apenas as mídias que passaram na validação
  const sendableMedia = mediaItems.filter(m => resolvedUrlMap.has(m.id))
  const [firstMedia, ...remainingMedia] = sendableMedia
  const useMessageAsFirstMediaCaption = Boolean(messageText && firstMedia && firstMedia.mediaType === 'image')

  const sendMediaItem = async (media: MediaItem, attachMessage: boolean) => {
    const resolved = resolvedUrlMap.get(media.id)
    if (!resolved) return

    // Usa a URL ORIGINAL da midia (nao o Data URI da pre-validacao)
    // A Evolution API baixa o arquivo diretamente via HTTP - garante encoding correto
    const originalUrl = ensureValidMediaUrl(safeTrim(resolveTemplate(media.url, contact)))

    try {
      if (media.mediaType === 'audio') {
        await sendEvolutionAudio({
          fetchImpl,
          evolutionUrl,
          evolutionApiKey,
          evolutionInstance,
          number: evolutionNumber,
          mediaUrl: originalUrl,
        })
      } else {
        await sendEvolutionMedia({
          fetchImpl,
          evolutionUrl,
          evolutionApiKey,
          evolutionInstance,
          number: evolutionNumber,
          media,
          mediaUrl: originalUrl,
          caption: buildMediaCaption(
            messageText,
            safeTrim(resolveTemplate(media.caption || '', contact)),
            attachMessage
          ),
        })
      }
      result.mediaSent += 1
      result.mediaDetails.push({ id: media.id, type: media.mediaType, status: 'sent' })
      if (attachMessage) result.sentText = true
    } catch (error) {
      result.mediaFailed += 1
      const errMsg = String((error as any)?.message || error)
      result.errors.push(`Falha ao enviar mídia ${media.id}: ${errMsg}`)
      result.mediaDetails.push({ id: media.id, type: media.mediaType, status: 'failed', error: errMsg })

      // FALLBACK: Se esta mídia ia carregar o texto como legenda e falhou, envia o texto sozinho
      if (attachMessage && messageText) {
        try {
          await postEvolution(fetchImpl, `${evolutionUrl}/message/sendText/${evolutionInstance}`, evolutionApiKey, {
            number: evolutionNumber,
            text: messageText,
            linkPreview: true,
          })
          result.sentText = true
        } catch (textErr) {
          result.errors.push(`Falha no fallback de texto: ${String((textErr as any)?.message || textErr)}`)
        }
      }
    }
  }

  // ── EXECUÇÃO SEQUENCIAL ──
  if (firstMedia) {
    await sendMediaItem(firstMedia, useMessageAsFirstMediaCaption)
    if (remainingMedia.length > 0 || (messageText && !useMessageAsFirstMediaCaption) || plan.sharedContact) {
      await wait(INTRA_CONTACT_DELAY_MS)
    }
  }

  if (messageText && !useMessageAsFirstMediaCaption) {
    try {
      await postEvolution(fetchImpl, `${evolutionUrl}/message/sendText/${evolutionInstance}`, evolutionApiKey, {
        number: evolutionNumber,
        text: messageText,
        linkPreview: true,
      })
      result.sentText = true
    } catch (textErr) {
      result.errors.push(`Falha ao enviar texto: ${String((textErr as any)?.message || textErr)}`)
    }
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

