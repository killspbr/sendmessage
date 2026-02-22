// Funções utilitárias compartilhadas

// URL do backend - usa o mesmo hostname do frontend
// Em ambiente local (HTTP) mantém a porta 4000.
// Em produção (HTTPS) usa o mesmo host e protocolo da página, sem porta explícita, evitando Mixed Content.
const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:'
const port = window.location.protocol === 'https:' ? '' : ':4000'
export const BACKEND_URL = `${protocol}//${window.location.hostname}${port}`

// Normaliza telefone removendo caracteres não numéricos
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '')
}

// Formata avaliação com estrela
export function formatRating(rating: string): string {
  if (!rating) return '—'
  return `⭐ ${rating}`
}

// Gera ID único
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}

// Formata data para exibição
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Formata data ISO
export function formatDateISO(date: Date): string {
  return date.toISOString()
}

// Logging padronizado de erros
export function logError(context: string, error?: unknown, extra?: unknown): void {
  const prefix = `[${context}]`

  if (extra !== undefined && error !== undefined) {
    // eslint-disable-next-line no-console
    console.error(prefix, error, extra)
  } else if (error !== undefined) {
    // eslint-disable-next-line no-console
    console.error(prefix, error)
  } else {
    // eslint-disable-next-line no-console
    console.error(prefix)
  }
}
