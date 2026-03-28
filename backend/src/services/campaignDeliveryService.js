import { extractImages, htmlToWhatsapp, resolveTemplate, toEvolutionNumber } from '../utils/messageUtils.js'

const MAX_MEDIA_ITEMS = 5
const ALLOWED_MEDIA_TYPES = new Set(['image', 'document', 'audio'])

function safeTrim(value) {
  return String(value || '').trim()
}

function isValidHttpUrl(value) {
  try {
    const url = new URL(String(value || '').trim())
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function ensureHtmlMessage(message) {
  const raw = String(message || '').trim()
  if (!raw) return ''

  if (raw.startsWith('<')) return raw

  return `<p style="margin:0; font-size:14px; line-height:1.5; color:#111827;">${raw
    .split('\n')
    .map((line) => (line.trim().length === 0 ? '&nbsp;' : line))
    .join('<br />')}</p>`
}

function normalizeMediaItem(item, index) {
  const mediaType = safeTrim(item?.mediaType || 'image').toLowerCase()
  const url = safeTrim(item?.url)
  const caption = safeTrim(item?.caption)
  const sourceType = safeTrim(item?.sourceType || 'url').toLowerCase()

  if (!url || !ALLOWED_MEDIA_TYPES.has(mediaType)) {
    return null
  }

  return {
    id: safeTrim(item?.id) || `media-${index + 1}`,
    sourceType: sourceType === 'asset' ? 'asset' : 'url',
    mediaType,
    url,
    caption,
    assetId: safeTrim(item?.assetId),
    assetName: safeTrim(item?.assetName),
    mimeType: safeTrim(item?.mimeType),
    sizeBytes: Number(item?.sizeBytes || 0) || undefined,
  }
}

function normalizeSharedContact(contact) {
  if (!contact || typeof contact !== 'object') return null

  const fullName = safeTrim(contact.fullName)
  const phone = safeTrim(contact.phone)
  const company = safeTrim(contact.company)
  const email = safeTrim(contact.email)
  const url = safeTrim(contact.url)

  if (!fullName && !phone && !company && !email && !url) {
    return null
  }

  return {
    fullName,
    phone,
    company,
    email,
    url,
  }
}

export function parseCampaignDeliveryPayload(rawPayload) {
  if (!rawPayload) return null

  try {
    const parsed = typeof rawPayload === 'string' ? JSON.parse(rawPayload) : rawPayload
    if (!parsed || typeof parsed !== 'object') return null

    const blocks = Array.isArray(parsed?.whatsapp?.blocks) ? parsed.whatsapp.blocks : []
    const normalizedBlocks = []

    for (const block of blocks) {
      const type = safeTrim(block?.type).toLowerCase()

      if (type === 'text') {
        const content = String(block?.content || '')
        if (content.trim()) {
          normalizedBlocks.push({ type: 'text', content })
        }
        continue
      }

      if (type === 'media') {
        const items = Array.isArray(block?.items)
          ? block.items
              .map((item, index) => normalizeMediaItem(item, index))
              .filter(Boolean)
              .slice(0, MAX_MEDIA_ITEMS)
          : []

        if (items.length > 0) {
          normalizedBlocks.push({ type: 'media', items })
        }
        continue
      }

      if (type === 'contact') {
        const contact = normalizeSharedContact(block?.contact)
        if (contact) {
          normalizedBlocks.push({ type: 'contact', contact })
        }
      }
    }

    return normalizedBlocks.length > 0
      ? {
          version: Number(parsed?.version || 1),
          whatsapp: {
            blocks: normalizedBlocks,
          },
        }
      : null
  } catch {
    return null
  }
}

export function validateCampaignDeliveryPayload(rawPayload, channels = []) {
  const errors = []

  if (rawPayload == null) {
    return { payload: null, errors }
  }

  const payload = parseCampaignDeliveryPayload(rawPayload)
  if (!payload) {
    return {
      payload: null,
      errors: ['O payload estruturado da campanha esta invalido.'],
    }
  }

  const whatsappEnabled = Array.isArray(channels) && channels.includes('whatsapp')

  if (whatsappEnabled) {
    const mediaItems = payload.whatsapp.blocks
      .filter((block) => block.type === 'media')
      .flatMap((block) => block.items || [])

    if (mediaItems.length > MAX_MEDIA_ITEMS) {
      errors.push(`A campanha suporta no maximo ${MAX_MEDIA_ITEMS} midias por WhatsApp.`)
    }

    for (const media of mediaItems) {
      if (!isValidHttpUrl(media.url)) {
        errors.push(`A midia "${media.id}" precisa usar uma URL publica valida.`)
      }
    }

    const contactBlock = payload.whatsapp.blocks.find((block) => block.type === 'contact')
    if (contactBlock?.contact) {
      if (!contactBlock.contact.fullName) {
        errors.push('O contato compartilhado precisa ter nome.')
      }

      if (!contactBlock.contact.phone) {
        errors.push('O contato compartilhado precisa ter telefone.')
      }
    }
  }

  return { payload, errors }
}

export function buildCampaignDeliveryPlan(campaign, options = {}) {
  const payload = parseCampaignDeliveryPayload(campaign?.delivery_payload)
  const textBlock = payload?.whatsapp?.blocks?.find((block) => block.type === 'text')
  const mediaItems =
    payload?.whatsapp?.blocks
      ?.filter((block) => block.type === 'media')
      .flatMap((block) => block.items || []) ?? []
  const contactBlock = payload?.whatsapp?.blocks?.find((block) => block.type === 'contact')

  const messageHtml = ensureHtmlMessage(options.messageOverride || textBlock?.content || campaign?.message || '')
  const legacyImages =
    payload == null
      ? extractImages(resolveTemplate(messageHtml, {})).map((url, index) => ({
          id: `legacy-image-${index + 1}`,
          sourceType: 'url',
          mediaType: 'image',
          url,
          caption: '',
        }))
      : []

  return {
    payload,
    messageHtml,
    mediaItems: payload ? mediaItems : legacyImages,
    sharedContact: contactBlock?.contact || null,
  }
}

async function postEvolution(fetchImpl, url, apiKey, body) {
  const response = await fetchImpl(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: apiKey,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(await response.text())
  }
}

function resolveMediaCaption(caption, contact) {
  return safeTrim(resolveTemplate(caption || '', contact))
}

function inferFileNameFromUrl(url) {
  try {
    const parsed = new URL(String(url || '').trim())
    const pathname = parsed.pathname || ''
    return safeTrim(decodeURIComponent(pathname.split('/').pop() || ''))
  } catch {
    return ''
  }
}

function sanitizeFileName(fileName, fallbackBase = 'arquivo') {
  const safeName = safeTrim(fileName)
    .replace(/[<>:"/\\|?*\x00-\x1F]+/g, '-')
    .replace(/\s+/g, ' ')
    .trim()

  return safeName || fallbackBase
}

function inferMimeType(media) {
  const explicitMime = safeTrim(media?.mimeType).toLowerCase()
  if (explicitMime) return explicitMime

  const fileName = `${safeTrim(media?.assetName)} ${inferFileNameFromUrl(media?.url || '')}`.toLowerCase()

  if (fileName.endsWith('.pdf')) return 'application/pdf'
  if (fileName.endsWith('.pptx')) return 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  if (fileName.endsWith('.ppt')) return 'application/vnd.ms-powerpoint'
  if (fileName.endsWith('.mp3')) return 'audio/mpeg'
  if (fileName.endsWith('.wav')) return 'audio/wav'
  if (fileName.endsWith('.mp4')) return 'video/mp4'
  if (fileName.endsWith('.png')) return 'image/png'
  if (fileName.endsWith('.webp')) return 'image/webp'
  if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')) return 'image/jpeg'

  if (media?.mediaType === 'audio') return 'audio/mpeg'
  return media?.mediaType === 'document' ? 'application/octet-stream' : 'image/jpeg'
}

function resolveMediaFileName(media) {
  const fromAsset = safeTrim(media?.assetName)
  if (fromAsset) {
    return sanitizeFileName(
      fromAsset,
      media?.mediaType === 'document'
        ? 'documento'
        : media?.mediaType === 'audio'
          ? 'audio'
          : 'imagem'
    )
  }

  const fromUrl = inferFileNameFromUrl(media?.url || '')
  if (fromUrl) {
    return sanitizeFileName(
      fromUrl,
      media?.mediaType === 'document'
        ? 'documento'
        : media?.mediaType === 'audio'
          ? 'audio'
          : 'imagem'
    )
  }

  const fallbackExt =
    media?.mediaType === 'document' ? '.pdf' : media?.mediaType === 'audio' ? '.mp3' : '.jpg'
  return sanitizeFileName(`${media?.id || 'arquivo'}${fallbackExt}`, 'arquivo')
}

function buildMediaCaption({ messageText, mediaCaption, attachMessage }) {
  const parts = []

  if (attachMessage && safeTrim(messageText)) {
    parts.push(safeTrim(messageText))
  }

  if (safeTrim(mediaCaption)) {
    parts.push(safeTrim(mediaCaption))
  }

  return parts.join('\n\n').trim()
}

function canUseMessageAsFirstMediaCaption(media) {
  return media?.mediaType === 'image'
}

async function resolveMediaBody(fetchImpl, media, resolvedUrl) {
  if (media.sourceType !== 'asset') {
    return resolvedUrl
  }

  const response = await fetchImpl(resolvedUrl)
  if (!response.ok) {
    throw new Error(`Falha ao carregar o arquivo do servidor: ${await response.text()}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer).toString('base64')
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
}) {
  const mediaBody = await resolveMediaBody(fetchImpl, media, resolvedUrl)
  const fileName = resolveMediaFileName(media)
  const mimeType = inferMimeType(media)

  try {
    await postEvolution(
      fetchImpl,
      `${evolutionUrl}/message/sendMedia/${evolutionInstance}`,
      evolutionApiKey,
      {
        number,
        mediatype: media.mediaType,
        mimetype: mimeType,
        fileName,
        caption,
        media: mediaBody,
        mediaMessage: {
          mediaType: media.mediaType,
          fileName,
          caption,
          mimetype: mimeType,
          media: mediaBody,
        },
      }
    )
    return
  } catch (error) {
    const message = String(error?.message || '')
    if (!message.includes('"mediaMessage"')) {
      throw error
    }
  }

  await postEvolution(
    fetchImpl,
    `${evolutionUrl}/message/sendMedia/${evolutionInstance}`,
    evolutionApiKey,
    {
      number,
      mediaMessage: {
        mediaType: media.mediaType,
        fileName,
        caption,
        mimetype: mimeType,
        media: mediaBody,
      },
    }
  )
}

async function sendEvolutionAudio({
  fetchImpl,
  evolutionUrl,
  evolutionApiKey,
  evolutionInstance,
  number,
  media,
  resolvedUrl,
}) {
  const audioBody = await resolveMediaBody(fetchImpl, media, resolvedUrl)

  await postEvolution(
    fetchImpl,
    `${evolutionUrl}/message/sendWhatsAppAudio/${evolutionInstance}`,
    evolutionApiKey,
    {
      number,
      audio: audioBody,
    }
  )
}

function resolveSharedContact(sharedContact, contact) {
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
}) {
  const contactNumber = toEvolutionNumber(sharedContact.phone)
  if (!contactNumber) {
    throw new Error('Telefone do contato compartilhado esta invalido.')
  }

  const payloadContact = {
    wuid: `${contactNumber}@s.whatsapp.net`,
    phoneNumber: contactNumber,
    fullName: sharedContact.fullName,
    organization: sharedContact.company || undefined,
    email: sharedContact.email || undefined,
    url: sharedContact.url || undefined,
  }

  try {
    await postEvolution(
      fetchImpl,
      `${evolutionUrl}/message/sendContact/${evolutionInstance}`,
      evolutionApiKey,
      {
        number,
        contact: [payloadContact],
        contactMessage: [payloadContact],
      }
    )
    return
  } catch (error) {
    const message = String(error?.message || '')
    if (!message.includes('"contactMessage"')) {
      throw error
    }
  }

  await postEvolution(
    fetchImpl,
    `${evolutionUrl}/message/sendContact/${evolutionInstance}`,
    evolutionApiKey,
    {
      number,
      contactMessage: [payloadContact],
    }
  )
}

export async function executeWhatsappCampaignDelivery({
  fetchImpl = fetch,
  evolutionUrl,
  evolutionApiKey,
  evolutionInstance,
  campaign,
  contact,
  messageOverride,
}) {
  const evolutionNumber = toEvolutionNumber(contact.phone)
  if (!evolutionNumber) {
    throw new Error('Contato sem telefone valido para envio no formato Evolution.')
  }

  const plan = buildCampaignDeliveryPlan(campaign, { messageOverride })
  const resolvedHtml = resolveTemplate(plan.messageHtml, contact)
  const messageText = htmlToWhatsapp(resolvedHtml)

  const result = {
    sentText: false,
    mediaSent: 0,
    mediaFailed: 0,
    contactSent: false,
    contactFailed: false,
    errors: [],
  }

  const [firstMedia, ...remainingMedia] = plan.mediaItems
  const useMessageAsFirstMediaCaption = Boolean(
    messageText && firstMedia && canUseMessageAsFirstMediaCaption(firstMedia)
  )

  const sendMediaItem = async (media, options = {}) => {
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
        })
      } else {
        const caption = buildMediaCaption({
          messageText,
          mediaCaption: resolveMediaCaption(media.caption, contact),
          attachMessage: Boolean(options.attachMessage),
        })

        await sendEvolutionMedia({
          fetchImpl,
          evolutionUrl,
          evolutionApiKey,
          evolutionInstance,
          number: evolutionNumber,
          media,
          resolvedUrl,
          caption,
        })
      }

      result.mediaSent += 1
      if (options.attachMessage) {
        result.sentText = true
      }
    } catch (error) {
      result.mediaFailed += 1
      result.errors.push(`Falha ao enviar midia ${media.id}: ${error?.message || 'erro desconhecido'}`)
    }
  }

  if (firstMedia) {
    await sendMediaItem(firstMedia, { attachMessage: useMessageAsFirstMediaCaption })
  }

  if (messageText && !useMessageAsFirstMediaCaption) {
    await postEvolution(
      fetchImpl,
      `${evolutionUrl}/message/sendText/${evolutionInstance}`,
      evolutionApiKey,
      {
        number: evolutionNumber,
        text: messageText,
        linkPreview: true,
      }
    )
    result.sentText = true
  }

  for (const media of remainingMedia) {
    await sendMediaItem(media, { attachMessage: false })
  }

  if (plan.sharedContact) {
    const resolvedSharedContact = resolveSharedContact(plan.sharedContact, contact)

    if (!resolvedSharedContact) {
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
          sharedContact: resolvedSharedContact,
        })
        result.contactSent = true
      } catch (error) {
        result.contactFailed = true
        result.errors.push(`Falha ao enviar contato compartilhado: ${error?.message || 'erro desconhecido'}`)
      }
    }
  }

  return result
}
