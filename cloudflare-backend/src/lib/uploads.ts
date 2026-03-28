import type { Pool } from 'pg'

export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024
export const DEFAULT_USER_UPLOAD_QUOTA_BYTES = 100 * 1024 * 1024

const FILE_RULES = [
  { mediaType: 'image', extensions: ['jpg', 'jpeg', 'png', 'webp'], mimeTypes: ['image/jpeg', 'image/png', 'image/webp'] },
  { mediaType: 'document', extensions: ['pdf', 'ppt', 'pptx'], mimeTypes: ['application/pdf', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'] },
  { mediaType: 'audio', extensions: ['wav', 'mp3'], mimeTypes: ['audio/wav', 'audio/mpeg', 'audio/mp3'] },
  { mediaType: 'document', extensions: ['mp4'], mimeTypes: ['video/mp4'] },
] as const

export function normalizeUploadDisplayName(name: string) {
  return String(name || '').normalize('NFC')
}

export function resolveFileRule(mimeType: string, originalName: string) {
  const cleanMime = String(mimeType || '').toLowerCase()
  const ext = String(originalName || '').split('.').pop()?.toLowerCase() || ''
  return FILE_RULES.find((rule) => rule.mimeTypes.includes(cleanMime as never) || rule.extensions.includes(ext as never)) || null
}

export async function getUploadUsageBytes(db: Pool, userId: string) {
  const result = await db.query(
    `SELECT COALESCE(SUM(size_bytes), 0)::bigint AS total
       FROM user_uploaded_files
      WHERE user_id = $1
        AND deleted_at IS NULL`,
    [userId]
  )
  return Number(result.rows[0]?.total || 0)
}

export function buildObjectKey(userId: string, storedName: string) {
  return `${userId}/${storedName}`
}

export function buildPublicFileToken() {
  return crypto.randomUUID().replace(/-/g, '')
}
