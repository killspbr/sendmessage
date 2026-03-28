import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024
export const DEFAULT_USER_UPLOAD_QUOTA_BYTES = 100 * 1024 * 1024
export const DEFAULT_DAILY_MESSAGE_LIMIT = 300
export const DEFAULT_MONTHLY_MESSAGE_LIMIT = 9000
export const DEFAULT_GLOBAL_GEMINI_DAILY_LIMIT = 5000

export const STORAGE_ROOT = path.resolve(__dirname, '..', '..', 'storage', 'uploads')

export const ALLOWED_FILE_RULES = [
  { mimes: ['image/jpeg', 'image/pjpeg'], extensions: ['.jpg', '.jpeg'], mediaType: 'image' },
  { mimes: ['image/png'], extensions: ['.png'], mediaType: 'image' },
  { mimes: ['image/webp'], extensions: ['.webp'], mediaType: 'image' },
  { mimes: ['application/pdf'], extensions: ['.pdf'], mediaType: 'document' },
  {
    mimes: [
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/octet-stream',
    ],
    extensions: ['.pptx'],
    mediaType: 'document',
  },
  {
    mimes: ['application/vnd.ms-powerpoint', 'application/octet-stream'],
    extensions: ['.ppt'],
    mediaType: 'document',
  },
  {
    mimes: ['audio/wav', 'audio/x-wav', 'audio/wave', 'audio/vnd.wave', 'application/octet-stream'],
    extensions: ['.wav'],
    mediaType: 'audio',
  },
  {
    mimes: ['audio/mpeg', 'audio/mp3', 'audio/mpeg3', 'application/octet-stream'],
    extensions: ['.mp3'],
    mediaType: 'audio',
  },
  {
    mimes: ['video/mp4', 'application/octet-stream'],
    extensions: ['.mp4'],
    mediaType: 'document',
  },
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

export function normalizeUploadDisplayName(name) {
  const rawName = String(name || '').trim()
  if (!rawName) return 'arquivo'

  const mojibakePattern = /[\u00C3\u00C2\u00E2\u00CC\u00C8\u00D2\u00D9\u00C0\u00D5]/u
  const replacementChar = '\uFFFD'
  const commonReplacements = [
    ['\u00C3\u00A1', '\u00E1'],
    ['\u00C3\u00A2', '\u00E2'],
    ['\u00C3\u00A3', '\u00E3'],
    ['\u00C3\u00A0', '\u00E0'],
    ['\u00C3\u00A4', '\u00E4'],
    ['\u00C3\u0081', '\u00C1'],
    ['\u00C3\u0082', '\u00C2'],
    ['\u00C3\u0083', '\u00C3'],
    ['\u00C3\u0080', '\u00C0'],
    ['\u00C3\u0084', '\u00C4'],
    ['\u00C3\u00A9', '\u00E9'],
    ['\u00C3\u00AA', '\u00EA'],
    ['\u00C3\u00A8', '\u00E8'],
    ['\u00C3\u00AB', '\u00EB'],
    ['\u00C3\u0089', '\u00C9'],
    ['\u00C3\u008A', '\u00CA'],
    ['\u00C3\u0088', '\u00C8'],
    ['\u00C3\u008B', '\u00CB'],
    ['\u00C3\u00AD', '\u00ED'],
    ['\u00C3\u00AC', '\u00EC'],
    ['\u00C3\u00AF', '\u00EF'],
    ['\u00C3\u008D', '\u00CD'],
    ['\u00C3\u008C', '\u00CC'],
    ['\u00C3\u008F', '\u00CF'],
    ['\u00C3\u00B3', '\u00F3'],
    ['\u00C3\u00B4', '\u00F4'],
    ['\u00C3\u00B5', '\u00F5'],
    ['\u00C3\u00B2', '\u00F2'],
    ['\u00C3\u00B6', '\u00F6'],
    ['\u00C3\u0093', '\u00D3'],
    ['\u00C3\u0094', '\u00D4'],
    ['\u00C3\u0095', '\u00D5'],
    ['\u00C3\u0092', '\u00D2'],
    ['\u00C3\u0096', '\u00D6'],
    ['\u00C3\u00BA', '\u00FA'],
    ['\u00C3\u00B9', '\u00F9'],
    ['\u00C3\u00BC', '\u00FC'],
    ['\u00C3\u009A', '\u00DA'],
    ['\u00C3\u0099', '\u00D9'],
    ['\u00C3\u009C', '\u00DC'],
    ['\u00C3\u00A7', '\u00E7'],
    ['\u00C3\u0087', '\u00C7'],
    ['\u00C3\u00B1', '\u00F1'],
    ['\u00C3\u0091', '\u00D1'],
    ['\u00E2\u20AC\u201C', '-'],
    ['\u00E2\u20AC\u201D', '-'],
    ['\u00E2\u20AC\u02DC', "'"],
    ['\u00E2\u20AC\u2122', "'"],
    ['\u00E2\u20AC\u0153', '"'],
    ['\u00E2\u20AC\u009D', '"'],
    ['\u00E2\u20AC\u00A6', '...'],
    ['\u00E2\u20AC\u00A2', '-'],
    ['\u00CC', '\u00ED'],
    ['\u00C8', '\u00E9'],
    ['\u00D2', '\u00F3'],
    ['\u00D9', '\u00FA'],
    ['\u00C0', '\u00E0'],
    ['\u00D5', '\u00F5'],
  ]

  const countSuspiciousChars = (value) => {
    const mojibakeHits = value.match(/[\u00C3\u00C2\u00E2\u00CC\u00C8\u00D2\u00D9\u00C0\u00D5]/gu) || []
    const replacementHits = value.match(new RegExp(replacementChar, 'gu')) || []
    return mojibakeHits.length + replacementHits.length * 2
  }

  const applyCommonReplacements = (value) =>
    commonReplacements.reduce((currentValue, [from, to]) => currentValue.split(from).join(to), value)

  const candidates = [rawName, applyCommonReplacements(rawName)]

  if (mojibakePattern.test(rawName)) {
    try {
      const decoded = Buffer.from(rawName, 'latin1').toString('utf8').trim()
      if (decoded && !decoded.includes(replacementChar)) {
        candidates.push(decoded)
        candidates.push(applyCommonReplacements(decoded))
      }
    } catch {
      // noop
    }
  }

  return candidates.reduce((bestValue, candidate) => {
    if (!candidate) return bestValue
    const normalizedCandidate = candidate.trim()
    if (!normalizedCandidate) return bestValue
    return countSuspiciousChars(normalizedCandidate) < countSuspiciousChars(bestValue)
      ? normalizedCandidate
      : bestValue
  }, rawName)
}

export function getFileExtension(name) {
  return path.extname(String(name || '')).toLowerCase()
}

export function resolveFileRule(mimeType, originalName) {
  const extension = getFileExtension(originalName)
  const normalizedMime = String(mimeType || '').toLowerCase()

  return (
    ALLOWED_FILE_RULES.find((rule) => {
      if (!rule.extensions.includes(extension)) return false
      if (!normalizedMime) return true
      return rule.mimes.includes(normalizedMime) || normalizedMime === 'application/octet-stream'
    }) || null
  )
}

export function isAllowedUpload(mimeType, originalName) {
  return Boolean(resolveFileRule(mimeType, originalName))
}

export function buildStoredFileName(originalName) {
  const normalizedName = normalizeUploadDisplayName(originalName)
  const safeBase = sanitizeOriginalName(path.basename(normalizedName, path.extname(normalizedName)))
  const extension = getFileExtension(normalizedName)
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

export function isStoredFileAvailable(file) {
  if (file?.file_blob) {
    return true
  }

  if (file?.storage_path && fs.existsSync(file.storage_path)) {
    return true
  }

  return false
}

export function canInlineInBrowser(mimeType) {
  return (
    String(mimeType || '').startsWith('image/') ||
    mimeType === 'application/pdf' ||
    mimeType === 'video/mp4' ||
    mimeType === 'audio/mpeg' ||
    mimeType === 'audio/mp3' ||
    mimeType === 'audio/wav' ||
    mimeType === 'audio/x-wav' ||
    mimeType === 'audio/wave'
  )
}

export function formatUploadFileResponse(baseUrl, file) {
  const isAvailable = isStoredFileAvailable(file)
  return {
    id: file.id,
    originalName: normalizeUploadDisplayName(file.original_name),
    storedName: file.stored_name,
    mimeType: file.mime_type,
    extension: file.extension,
    sizeBytes: Number(file.size_bytes || 0),
    mediaType: file.media_type,
    createdAt: file.created_at,
    canInline: canInlineInBrowser(file.mime_type),
    publicUrl: buildPublicFileUrl(baseUrl, file),
    isAvailable,
    availabilityReason: isAvailable ? null : 'Arquivo indisponivel no armazenamento atual. Reenvie para a biblioteca.',
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
