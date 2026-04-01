/**
 * mediaResolver.ts
 * Single Source of Truth para resolução de URLs de mídia.
 * Centraliza toda a lógica de descoberta, validação e geração de Data URI.
 */

type MediaSource = 'r2' | 'external' | 'error'

export interface ResolvedMedia {
  url: string
  source: MediaSource
  error?: string
  mediaId: string
}

export interface MediaResolverEnv {
  UPLOADS_BUCKET?: { get(key: string): Promise<any>; head(key: string): Promise<any> }
  db?: { query(text: string, params?: any[]): Promise<any> }
}

function isObsoleteLocalPath(storagePath: string): boolean {
  return storagePath.startsWith('/app/storage/')
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  const chunkSize = 0x8000
  let binary = ''
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize)
    binary += String.fromCharCode(...chunk)
  }
  return btoa(binary)
}

function extractPublicTokenFromUrl(url: string): { token: string; storedName: string } | null {
  const match = url.match(/\/uploads\/public\/([^/?#]+)\/([^/?#]+)/)
  if (!match) return null
  return {
    token: decodeURIComponent(match[1]),
    storedName: decodeURIComponent(match[2]),
  }
}

/**
 * Resolve uma mídia para uma URL utilizável pela Evolution API.
 *
 * Ordem de resolução:
 * 1. Se é asset interno → tenta R2 direto via DB lookup
 *    - Se storage_path é legado (/app/storage/) → rejeita com OBSOLETE_FILE
 *    - Se R2 retorna → converte para Data URI base64
 * 2. Se é URL externa → valida protocolo HTTP(S) e retorna como está
 * 3. Qualquer falha → retorna { source: 'error', error: '...' }
 */
export async function resolveMediaUrl(opts: {
  mediaId: string
  url: string
  sourceType: 'url' | 'asset'
  mimeType: string
  env?: MediaResolverEnv
}): Promise<ResolvedMedia> {
  const { mediaId, url, sourceType, mimeType, env } = opts
  const trimmedUrl = (url || '').trim()

  if (!trimmedUrl) {
    return { url: '', source: 'error', error: 'URL vazia', mediaId }
  }

  const isInternal = trimmedUrl.includes('sendmessage-backend') || sourceType === 'asset'

  // --- Caminho R2 (interno) ---
  if (isInternal && env?.UPLOADS_BUCKET && env?.db) {
    const parsed = extractPublicTokenFromUrl(trimmedUrl)
    if (!parsed) {
      console.log(`[MediaResolver] ${mediaId}: Regex falhou para URL: ${trimmedUrl.substring(0, 100)}`)
      return { url: '', source: 'error', error: `URL interna não reconhecida: ${trimmedUrl}`, mediaId }
    }

    console.log(`[MediaResolver] ${mediaId}: token=${parsed.token.substring(0, 12)}... storedName=${parsed.storedName.substring(0, 40)}`)

    try {
      const fileResult = await env.db.query(
        `SELECT storage_path FROM public.user_uploaded_files WHERE public_token = $1 AND stored_name = $2 AND deleted_at IS NULL LIMIT 1`,
        [parsed.token, parsed.storedName]
      )

      const storagePath = fileResult.rows[0]?.storage_path
      if (!storagePath) {
        console.log(`[MediaResolver] ${mediaId}: NAO encontrado no banco. token=${parsed.token} stored_name=${parsed.storedName}`)
        return { url: '', source: 'error', error: `Arquivo '${parsed.storedName}' não encontrado no banco (pode ter sido excluído).`, mediaId }
      }

      if (isObsoleteLocalPath(storagePath)) {
        return {
          url: '',
          source: 'error',
          error: `Arquivo obsoleto: '${parsed.storedName}' pertence a uma versão anterior do sistema. Remova-o da campanha e refaça o upload.`,
          mediaId,
        }
      }

      // Verifica existência no R2 sem baixar o conteúdo (o disparo usa URL pública)
      const head = await env.UPLOADS_BUCKET.head(storagePath)
      if (!head) {
        console.log(`[MediaResolver] ${mediaId}: Encontrado no DB (path=${storagePath}) mas NAO no R2`)
        return { url: '', source: 'error', error: `Arquivo '${parsed.storedName}' existe no banco mas não foi encontrado no storage R2.`, mediaId }
      }

      console.log(`[MediaResolver] ${mediaId}: OK (R2 validado, path=${storagePath})`)
      // Arquivo existe e está acessível — retorna a URL original para validação
      return { url: trimmedUrl, source: 'r2', mediaId }
    } catch (err: any) {
      console.log(`[MediaResolver] ${mediaId}: ERRO R2: ${err?.message || String(err)}`)
      return { url: '', source: 'error', error: `Erro ao verificar R2: ${err?.message || String(err)}`, mediaId }
    }
  }

  // --- Caminho externo ---
  try {
    const parsed = new URL(trimmedUrl)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { url: '', source: 'error', error: `URL com protocolo inválido: ${parsed.protocol}`, mediaId }
    }
    return { url: trimmedUrl, source: 'external', mediaId }
  } catch {
    return { url: '', source: 'error', error: `URL inválida: ${trimmedUrl}`, mediaId }
  }
}

/**
 * Pré-valida TODAS as mídias de uma campanha antes do disparo.
 * Retorna listas separadas de mídias válidas e inválidas.
 */
export async function preValidateMediaItems(items: Array<{
  id: string
  url: string
  sourceType: 'url' | 'asset'
  mimeType: string
}>, env?: MediaResolverEnv): Promise<{
  valid: ResolvedMedia[]
  invalid: ResolvedMedia[]
}> {
  const results = await Promise.all(
    items.map(item => resolveMediaUrl({
      mediaId: item.id,
      url: item.url,
      sourceType: item.sourceType,
      mimeType: item.mimeType,
      env,
    }))
  )

  return {
    valid: results.filter(r => r.source !== 'error'),
    invalid: results.filter(r => r.source === 'error'),
  }
}
