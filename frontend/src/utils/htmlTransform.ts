// HTML transformation utilities extracted from App.tsx

export function decodeHtml(html: string): string {
  if (typeof document === 'undefined') return html
  const txt = document.createElement('textarea')
  // Sanitiza: remove scripts e event handlers antes de decodificar entidades
  const sanitized = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/\son\w+\s*=\s*'[^']*'/gi, '')
    .replace(/\bon\w+\s*=\s*/gi, 'data-x-on=')
  txt.innerHTML = sanitized
  return txt.value
}

export function sanitizeHtmlForEmail(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/\son\w+\s*=\s*'[^']*'/gi, '')
    .replace(/\bon\w+\s*=\s*/gi, 'data-x-on=')
}

export function htmlToText(html: string): string {
  if (!html) return ''
  const decoded = decodeHtml(html)
  return decoded
    .replace(/<br\s*\/?>/gi, '<br />')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function htmlToWhatsapp(html: string): string {
  if (!html) return ''

  let text = html

  // negrito
  text = text.replace(/<(b|strong)>([\s\S]*?)<\/(b|strong)>/gi, '*$2*')
  // itálico
  text = text.replace(/<(i|em)>([\s\S]*?)<\/(i|em)>/gi, '_$2_')
  // rasurado
  text = text.replace(/<(s|del)>([\s\S]*?)<\/(s|del)>/gi, '~$2~')
  // código em bloco
  text = text.replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, '``$1``')
  // código inline
  text = text.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, '$1')

  // listas com marcas
  text = text.replace(/<li[^>]*>\s*([\s\S]*?)\s*<\/li>/gi, '• $1\n')

  // citação
  text = text.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, '> $1\n')

  // links
  text = text.replace(/<a[^>]+href="([^">]+)"[^>]*>([\s\S]*?)<\/a>/gi, (_match, url, label) => {
    const cleanLabel = label.replace(/<[^>]+>/g, '').trim()
    const cleanUrl = url.replace(/^(mailto|https?|tel):/i, '').replace(/^\/\//, '').replace(/\/$/, '').trim()
    const cleanLabelCompare = cleanLabel.replace(/^(mailto|https?|tel):/i, '').replace(/^\/\//, '').replace(/\/$/, '').trim()

    if (cleanUrl === cleanLabelCompare || !cleanLabel) {
      return url.startsWith('mailto:') ? cleanLabel : url
    }
    return `${cleanLabel} (${url})`
  })

  // separadores de blocos
  text = text
    .replace(/<\/?(ul|ol)[^>]*>/gi, '\n')
    .replace(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi, '*$1*\n')

  // quebras de linha e parágrafos
  text = text.replace(/<br\s*\/?>/gi, '\n')
  text = text.replace(/<\/(p|div)>/gi, '\n')

  // remover demais tags
  text = text.replace(/<[^>]+>/g, '')

  // decodificar entidades HTML
  text = decodeHtml(text)

  // Normalização
  text = text.replace(/[ \t]+\n/g, '\n')
  text = text.replace(/\n{2,}/g, '\n\n')

  return text.trim()
}
