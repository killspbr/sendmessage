import { Hono } from 'hono'
import type { Bindings, AppVariables } from '../types'
import { authenticateToken } from '../lib/auth'
import { buildObjectKey, buildPublicFileToken, DEFAULT_USER_UPLOAD_QUOTA_BYTES, getUploadUsageBytes, MAX_FILE_SIZE_BYTES, normalizeUploadDisplayName, resolveFileRule } from '../lib/uploads'
import { getDb } from '../lib/db'

export const uploadRoutes = new Hono<{ Bindings: Bindings; Variables: AppVariables }>()

uploadRoutes.get('/files', authenticateToken, async (c) => {
  const user = c.get('user')
  if (!user?.id) return c.json({ error: 'Acesso negado.' }, 401)
  const db = getDb(c.env)
  const result = await db.query(
    `SELECT *
       FROM user_uploaded_files
      WHERE user_id = $1
        AND deleted_at IS NULL
      ORDER BY created_at DESC`,
    [user.id]
  )
  return c.json(result.rows)
})

uploadRoutes.post('/files/upload', authenticateToken, async (c) => {
  const user = c.get('user')
  if (!user?.id) return c.json({ error: 'Acesso negado.' }, 401)
  const form = await c.req.formData()
  const file = form.get('file')

  if (!(file instanceof File)) {
    return c.json({ error: 'Arquivo obrigatorio.' }, 400)
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return c.json({ error: 'Cada arquivo deve ter no maximo 50 MB.' }, 400)
  }

  const rule = resolveFileRule(file.type, file.name)
  if (!rule) {
    return c.json({ error: 'Tipo de arquivo nao permitido. Envie imagem, PDF, PPT/PPTX, WAV, MP3 ou MP4.' }, 400)
  }

  const db = getDb(c.env)
  const usage = await getUploadUsageBytes(db, user.id)

  const adminCheck = await db.query(
    `SELECT 1
       FROM user_profiles up
       JOIN user_groups ug ON ug.id = up.group_id
      WHERE up.id = $1
        AND ug.name = 'Administrador'
      LIMIT 1`,
    [user.id]
  )

  const isAdmin = adminCheck.rows.length > 0
  if (!isAdmin && usage + file.size > DEFAULT_USER_UPLOAD_QUOTA_BYTES) {
    return c.json({ error: 'Limite de armazenamento excedido para este usuario.' }, 400)
  }

  const originalName = normalizeUploadDisplayName(file.name)
  const storedName = `${Date.now()}-${crypto.randomUUID().slice(0, 12)}-${originalName}`
  const publicToken = buildPublicFileToken()
  const objectKey = buildObjectKey(user.id, storedName)

  await c.env.UPLOADS_BUCKET.put(objectKey, await file.arrayBuffer(), {
    httpMetadata: {
      contentType: file.type || 'application/octet-stream',
      contentDisposition: `inline; filename="${originalName}"`,
    },
  })

  const inserted = await db.query(
    `INSERT INTO user_uploaded_files (
      user_id, original_name, stored_name, mime_type, extension, media_type, size_bytes, storage_path, public_token
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    RETURNING *`,
    [
      user.id,
      originalName,
      storedName,
      file.type || 'application/octet-stream',
      originalName.split('.').pop()?.toLowerCase() || '',
      rule.mediaType,
      file.size,
      objectKey,
      publicToken,
    ]
  )

  return c.json(inserted.rows[0], 201)
})

uploadRoutes.delete('/files/:id', authenticateToken, async (c) => {
  const user = c.get('user')
  if (!user?.id) return c.json({ error: 'Acesso negado.' }, 401)
  const id = c.req.param('id')
  const db = getDb(c.env)

  const result = await db.query(
    `UPDATE user_uploaded_files
        SET deleted_at = CURRENT_TIMESTAMP
      WHERE id = $1
        AND user_id = $2
        AND deleted_at IS NULL
    RETURNING *`,
    [id, user.id]
  )

  const file = result.rows[0]
  if (!file) {
    return c.json({ error: 'Arquivo nao encontrado.' }, 404)
  }

  await c.env.UPLOADS_BUCKET.delete(file.storage_path)
  return c.json({ ok: true })
})

uploadRoutes.get('/uploads/public/:token/:storedName', async (c) => {
  const { token, storedName } = c.req.param()
  const db = getDb(c.env)

  const result = await db.query(
    `SELECT *
       FROM user_uploaded_files
      WHERE public_token = $1
        AND stored_name = $2
        AND deleted_at IS NULL
      LIMIT 1`,
    [token, storedName]
  )

  const file = result.rows[0]
  if (!file) {
    return c.json({ error: 'Arquivo nao encontrado.' }, 404)
  }

  const object = await c.env.UPLOADS_BUCKET.get(file.storage_path)
  if (!object) {
    return c.json({ error: 'Arquivo nao encontrado no bucket.' }, 404)
  }

  const headers = new Headers()
  object.writeHttpMetadata(headers)
  headers.set('etag', object.httpEtag)
  return new Response(object.body, { headers })
})
