export function normalizePhone(phone: unknown) {
  const digits = String(phone || '').replace(/\D/g, '')
  return digits.startsWith('55') ? digits.slice(2) : digits
}

export function toEvolutionNumber(phone: unknown) {
  const local = normalizePhone(phone)
  if (!local) return null
  return `55${local}`
}

export const EVOLUTION_RETRY_ATTEMPTS = 3
export const EVOLUTION_RETRY_DELAYS_MS = [1500, 3000]

export function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function isRetryableEvolutionTransportError(error: unknown) {
  const message = String((error as any)?.message || '').toLowerCase()
  return (
    message.includes('connection closed') ||
    message.includes('socket hang up') ||
    message.includes('econnreset') ||
    message.includes('etimedout') ||
    message.includes('fetch failed') ||
    message.includes('und_err_socket') ||
    message.includes('eai_again') ||
    message.includes('enotfound')
  )
}

export async function postEvolution(fetchImpl: typeof fetch, url: string, apiKey: string, body: unknown) {
  const startedAt = Date.now()
  const response = await fetchImpl(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: apiKey },
    body: JSON.stringify(body),
  })

  const responseTimeMs = Date.now() - startedAt
  const rawText = await response.text().catch(() => '')

  if (!response.ok) {
    throw Object.assign(new Error(rawText || `HTTP ${response.status}`), {
      status: response.status,
      responseTimeMs,
    })
  }

  return { status: response.status, responseTimeMs, rawText }
}

export async function postEvolutionWithRetry(fetchImpl: typeof fetch, url: string, apiKey: string, body: unknown): Promise<{ status: number; responseTimeMs: number; rawText: string }> {
  let lastError: any = null
  for (let attempt = 1; attempt <= EVOLUTION_RETRY_ATTEMPTS; attempt++) {
    try {
      return await postEvolution(fetchImpl, url, apiKey, body)
    } catch (error) {
      lastError = error
      const canRetry = attempt < EVOLUTION_RETRY_ATTEMPTS && isRetryableEvolutionTransportError(error)
      if (!canRetry) throw error
      const delay = EVOLUTION_RETRY_DELAYS_MS[Math.min(attempt - 1, EVOLUTION_RETRY_DELAYS_MS.length - 1)]
      await wait(delay)
    }
  }
  throw lastError
}

// Garante que URLs com caracteres especiais (espaco, &, acentos) sejam validas
// para a Evolution API, que rejeita URLs com caracteres nao-encodados.
export function ensureValidMediaUrl(url: string): string {
  try {
    const parsed = new URL(url)
    // Re-encoda cada segmento do path (decodifica primeiro para evitar double-encoding)
    parsed.pathname = parsed.pathname
      .split('/')
      .map(seg => encodeURIComponent(decodeURIComponent(seg)))
      .join('/')
    return parsed.toString()
  } catch {
    return url
  }
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
export function ensureAbsoluteUrl(url: unknown, baseUrl: string) {
  const raw = String(url || '').trim()
  if (!raw) return ''
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw
  if (raw.startsWith('/')) return `${baseUrl.replace(/\/+$/, '')}${raw}`
  return `${baseUrl.replace(/\/+$/, '')}/${raw}`
}
