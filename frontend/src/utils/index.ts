// Funções utilitárias compartilhadas

// URL do backend - prioritiza variável de ambiente VITE_API_URL
export const BACKEND_URL = import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD
    ? 'https://clrodrigues-sendmessage-backend.rsybpi.easypanel.host'
    : 'http://localhost:4000');

// Normaliza telefone removendo caracteres não numéricos
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  // Se começar com 55, removemos para evitar duplicidade com o prefixo definido no n8n
  return digits.startsWith('55') ? digits.substring(2) : digits
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
