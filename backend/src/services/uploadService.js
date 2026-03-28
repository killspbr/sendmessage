import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024
export const DEFAULT_USER_UPLOAD_QUOTA_BYTES = 100 * 1024 * 1024
export const DEFAULT_DAILY_MESSAGE_LIMIT = 300
export const DEFAULT_MONTHLY_MESSAGE_LIMIT = 9000
export const DEFAULT_GLOBAL_GEMINI_DAILY_LIMIT = 5000

export const STORAGE_ROOT = path.resolve(__dirname, '..', '..', 'storage', 'uploads')

export const ALLOWED_FILE_RULES = [
  { mime: 'image/jpeg', extensions: ['.jpg', '.jpeg'], mediaType: 'image' },
  { mime: 'image/png', extensions: ['.png'], mediaType: 'image' },
  { mime: 'image/webp', extensions: ['.webp'], mediaType: 'image' },
  { mime: 'application/pdf', extensions: ['.pdf'], mediaType: 'document' },
  {
    mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    extensions: ['.pptx'],
    mediaType: 'document',
  },
  { mime: 'application/vnd.ms-powerpoint', extensions: ['.ppt'], mediaType: 'document' },
  { mime: 'audio/wav', extensions: ['.wav'], mediaType: 'document' },
  { mime: 'audio/x-wav', extensions: ['.wav'], mediaType: 'document' },
  { mime: 'audio/wave', extensions: ['.wav'], mediaType: 'document' },
  { mime: 'video/mp4', extensions: ['.mp4'], mediaType: 'document' },
]

export function ensureUploadStorageRoot() {
  fs.mkdirSync(STORAGE_ROOT, { recursive: true })
}

export function sanitizeOriginalName(name) {
  return String(name || 'arquivo')
    .normalize('NFKD')
    .replace(/[^\w.\-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 180) || 'arquivo'
}

export function getFileExtension(name) {
  return path.extname(String(name || '')).toLowerCase()
}

export function resolveFileRule(mimeType, originalName) {
  const extension = getFileExtension(originalName)
  return ALLOWED_FILE_RULES.find((rule) => rule.mime === mimeType && rule.extensions.includes(extension)) || null
}

export function isAllowedUpload(mimeType, originalName) {
  return Boolean(resolveFileRule(mimeType, originalName))
}

export function buildStoredFileName(originalName) {
  const safeBase = sanitizeOriginalName(path.basename(originalName, path.extname(originalName)))
  const extension = getFileExtension(originalName)
  return `${Date.now()}-${crypto.randomBytes(6).toString('hex')}-${safeBase}${extension}`
}

export function buildPublicFileToken() {
  return crypto.randomBytes(18).toString('hex')
}

export function getUserUploadDir(userId) {
  return path.join(STORAGE_ROOT, String(userId))
}

export function ensureUserUploadDir(userId) {
  const userDir = getUserUploadDir(userId)
  fs.mkdirSync(userDir, { recursive: true })
  return userDir
}

export function buildStoredFilePath(userId, storedName) {
  return path.join(getUserUploadDir(userId), storedName)
}

export function buildPublicFileUrl(baseUrl, file) {
  return `${baseUrl}/api/uploads/public/${file.public_token}/${encodeURIComponent(file.stored_name)}`
}

export function canInlineInBrowser(mimeType) {
  return (
    String(mimeType || '').startsWith('image/') ||
    mimeType === 'application/pdf' ||
    mimeType === 'video/mp4' ||
    mimeType === 'audio/wav' ||
    mimeType === 'audio/x-wav' ||
    mimeType === 'audio/wave'
  )
}

export function formatUploadFileResponse(baseUrl, file) {
  return {
    id: file.id,
    originalName: file.original_name,
    storedName: file.stored_name,
    mimeType: file.mime_type,
    extension: file.extension,
    sizeBytes: Number(file.size_bytes || 0),
    mediaType: file.media_type,
    createdAt: file.created_at,
    canInline: canInlineInBrowser(file.mime_type),
    publicUrl: buildPublicFileUrl(baseUrl, file),
  }
}

export async function getUploadUsageBytes(queryImpl, userId) {
  const result = await queryImpl(
    `SELECT COALESCE(SUM(size_bytes), 0)::bigint AS total
     FROM user_uploaded_files
     WHERE user_id = $1
       AND deleted_at IS NULL`,
    [userId]
  )

  return Number(result.rows[0]?.total || 0)
}

export function safeUnlink(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
  } catch {
    // noop
  }
}
