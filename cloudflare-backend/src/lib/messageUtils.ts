export function normalizePhone(phone: unknown) {
  const digits = String(phone || '').replace(/\D/g, '')
  return digits.startsWith('55') ? digits.slice(2) : digits
}

export function toEvolutionNumber(phone: unknown) {
  const local = normalizePhone(phone)
  if (!local) return null
  return `55${local}`
}

export function resolveTemplate(template: unknown, contact: Record<string, unknown>) {
  let result = String(template || '')
  const name = String(contact.name || '')
  const firstName = name.split(' ')[0] || name
  const replacements: Record<string, string> = {
    '{name}': name,
    '{primeiro_nome}': firstName,
    '{phone}': String(contact.phone || ''),
    '{category}': String(contact.category || ''),
    '{city}': String(contact.city || ''),
    '{email}': String(contact.email || ''),
    '{rating}': String(contact.rating || ''),
  }

  for (const [key, value] of Object.entries(replacements)) {
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    result = result.replace(new RegExp(escaped, 'g'), value)
  }

  return result
}

export function decodeHtmlEntities(value: unknown) {
  return String(value || '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
}

export function htmlToWhatsapp(html: unknown) {
  if (!html) return ''

  let text = String(html)
  text = text.replace(/<(b|strong)>([\s\S]*?)<\/(b|strong)>/gi, '*$2*')
  text = text.replace(/<(i|em)>([\s\S]*?)<\/(i|em)>/gi, '_$2_')
  text = text.replace(/<(s|del)>([\s\S]*?)<\/(s|del)>/gi, '~$2~')
  text = text.replace(/<a[^>]+href="([^">]+)"[^>]*>([\s\S]*?)<\/a>/gi, (_m, url, label) => {
    const cleanLabel = String(label || '').replace(/<[^>]+>/g, '').trim()
    if (!cleanLabel) return String(url || '')
    return `${cleanLabel} (${String(url || '')})`
  })
  text = text.replace(/<li[^>]*>\s*([\s\S]*?)\s*<\/li>/gi, '- $1\n')
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
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
