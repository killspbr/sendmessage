import { extractImages, htmlToWhatsapp, resolveTemplate, toEvolutionNumber } from '../utils/messageUtils.js'

const MAX_MEDIA_ITEMS = 5
const ALLOWED_MEDIA_TYPES = new Set(['image', 'document'])

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

  if (!url || !ALLOWED_MEDIA_TYPES.has(mediaType)) {
    return null
  }

  return {
    id: safeTrim(item?.id) || `media-${index + 1}`,
    sourceType: 'url',
    mediaType,
    url,
    caption,
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
      errors: ['O payload estruturado da campanha está inválido.'],
    }
  }

  const whatsappEnabled = Array.isArray(channels) && channels.includes('whatsapp')

  if (whatsappEnabled) {
    const mediaItems = payload.whatsapp.blocks
      .filter((block) => block.type === 'media')
      .flatMap((block) => block.items || [])

    if (mediaItems.length > MAX_MEDIA_ITEMS) {
      errors.push(`A campanha suporta no máximo ${MAX_MEDIA_ITEMS} mídias por WhatsApp.`)
    }

    for (const media of mediaItems) {
      if (!isValidHttpUrl(media.url)) {
        errors.push(`A mídia "${media.id}" precisa usar uma URL pública válida.`)
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

async function postEvolutionMessage(fetchImpl, url, apiKey, body) {
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
    throw new Error('Contato sem telefone válido para envio no formato Evolution.')
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

  if (messageText) {
    await postEvolutionMessage(
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

  for (const media of plan.mediaItems) {
    const resolvedUrl = safeTrim(resolveTemplate(media.url, contact))
    if (!isValidHttpUrl(resolvedUrl)) {
      result.mediaFailed += 1
      result.errors.push(`Mídia inválida ignorada: ${media.id}`)
      continue
    }

    try {
      await postEvolutionMessage(
        fetchImpl,
        `${evolutionUrl}/message/sendMedia/${evolutionInstance}`,
        evolutionApiKey,
        {
          number: evolutionNumber,
          media: resolvedUrl,
          mediatype: media.mediaType,
          caption: resolveMediaCaption(media.caption, contact),
        }
      )
      result.mediaSent += 1
    } catch (error) {
      result.mediaFailed += 1
      result.errors.push(`Falha ao enviar mídia ${media.id}: ${error?.message || 'erro desconhecido'}`)
    }
  }

  if (plan.sharedContact) {
    const resolvedSharedContact = resolveSharedContact(plan.sharedContact, contact)

    if (!resolvedSharedContact) {
      result.contactFailed = true
      result.errors.push('Contato compartilhado inválido ou incompleto.')
    } else {
      try {
        const contactNumber = toEvolutionNumber(resolvedSharedContact.phone)
        if (!contactNumber) {
          throw new Error('Telefone do contato compartilhado está inválido.')
        }

        await postEvolutionMessage(
          fetchImpl,
          `${evolutionUrl}/message/sendContact/${evolutionInstance}`,
          evolutionApiKey,
          {
            number: evolutionNumber,
            contactMessage: [
              {
                wuid: `${contactNumber}@s.whatsapp.net`,
                phoneNumber: contactNumber,
                fullName: resolvedSharedContact.fullName,
                organization: resolvedSharedContact.company || undefined,
                email: resolvedSharedContact.email || undefined,
                url: resolvedSharedContact.url || undefined,
              },
            ],
          }
        )
        result.contactSent = true
      } catch (error) {
        result.contactFailed = true
        result.errors.push(`Falha ao enviar contato compartilhado: ${error?.message || 'erro desconhecido'}`)
      }
    }
  }

  return result
}
