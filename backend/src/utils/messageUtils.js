export const normalizePhone = (phone) => {
  const digits = (phone || '').replace(/\D/g, '')
  return digits.startsWith('55') ? digits.substring(2) : digits
}

export const toEvolutionNumber = (phone) => {
  const local = normalizePhone(phone)
  if (!local) return null
  return `55${local}`
}

export const resolveTemplate = (tpl, contact) => {
  let result = tpl
  const data = {
    '{name}': contact.name || '',
    '{primeiro_nome}': (contact.name || '').split(' ')[0],
    '{phone}': contact.phone || '',
    '{category}': contact.category || '',
    '{city}': contact.city || '',
    '{email}': contact.email || '',
    '{rating}': contact.rating || '',
  }

  Object.entries(data).forEach(([key, val]) => {
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    result = result.replace(new RegExp(escapedKey, 'g'), val)
  })

  return result
}

export const extractImages = (html) => {
  const images = []
  const regex = /<img[^>]+src="([^">]+)"/gi
  let match
  while ((match = regex.exec(html)) !== null) {
    images.push(match[1])
  }
  return images
}

export const decodeHtmlEntities = (value) =>
  String(value || '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')

export const htmlToWhatsapp = (html) => {
  if (!html) return ''

  let text = html

  text = text.replace(/<(b|strong)>([\s\S]*?)<\/(b|strong)>/gi, '*$2*')
  text = text.replace(/<(i|em)>([\s\S]*?)<\/(i|em)>/gi, '_$2_')
  text = text.replace(/<(s|del)>([\s\S]*?)<\/(s|del)>/gi, '~$2~')

  text = text.replace(/<a[^>]+href="([^">]+)"[^>]*>([\s\S]*?)<\/a>/gi, (_match, url, label) => {
    const cleanLabel = label.replace(/<[^>]+>/g, '').trim()
    const cleanUrl = url
      .replace(/^(mailto|https?|tel):/i, '')
      .replace(/^\/\//, '')
      .replace(/\/$/, '')
      .trim()
    const cleanLabelCompare = cleanLabel
      .replace(/^(mailto|https?|tel):/i, '')
      .replace(/^\/\//, '')
      .replace(/\/$/, '')
      .trim()

    if (cleanUrl === cleanLabelCompare || !cleanLabel) {
      return url.startsWith('mailto:') ? cleanLabel : url
    }

    return `${cleanLabel} (${url})`
  })

  text = text.replace(/<li[^>]*>\s*([\s\S]*?)\s*<\/li>/gi, '• $1\n')
  text = text.replace(/<\/?(ul|ol)[^>]*>/gi, '\n')
  text = text.replace(/<br\s*\/?>/gi, '\n')
  text = text.replace(/<\/(p|div)>/gi, '\n')

  return decodeHtmlEntities(text)
    .replace(/<[^>]+>/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{2,}•/g, '\n•')
    .replace(/•\s*\n+/g, '• ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export const htmlToText = (html) =>
  decodeHtmlEntities(html)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .trim()
