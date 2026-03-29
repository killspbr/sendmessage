import { Hono } from 'hono'
import type { Bindings, AppVariables } from '../types'
import { authenticateToken } from '../lib/auth'
import { buildObjectKey, buildPublicFileToken, DEFAULT_USER_UPLOAD_QUOTA_BYTES, getUploadUsageBytes, MAX_FILE_SIZE_BYTES, normalizeUploadDisplayName, resolveFileRule } from '../lib/uploads'
import { getDb } from '../lib/db'
import { ensureCloudflareSchema } from '../lib/schema'

export const uploadRoutes = new Hono<{ Bindings: Bindings; Variables: AppVariables }>()

function mapFileRow(row: any) {
  if (!row) return null
  return {
    id: row.id,
    originalName: row.original_name || 'Sem nome',
    storedName: row.stored_name,
    mimeType: row.mime_type || 'application/octet-stream',
    extension: row.extension || '',
    mediaType: row.media_type || 'document',
    sizeBytes: Number(row.size_bytes || 0),
    createdAt: row.created_at,
    publicUrl: `/api/uploads/public/${row.public_token}/${row.stored_name}`,
    isAvailable: true,
    canInline: ['image', 'video', 'document'].includes(row.media_type) && row.mime_type !== 'application/pdf', 
  }
}

uploadRoutes.get('/files', authenticateToken, async (c) => {
  const user = c.get('user')
  if (!user?.id) return c.json({ error: 'Acesso negado.' }, 401)

  const db = getDb(c.env)
  try {
    // Garante que o esquema exista antes de listar
    await ensureCloudflareSchema(db)
    
    // Log para depuração de 500 no backend
    console.log('[Uploads] Listando arquivos para o usuário:', user.id)

    const result = await db.query(
      `SELECT id, user_id, original_name, stored_name, mime_type, extension, media_type, size_bytes, public_token, created_at
         FROM user_uploaded_files
        WHERE user_id = $1::uuid
          AND deleted_at IS NULL
        ORDER BY created_at DESC`,
      [user.id]
    )

    console.log(`[Uploads] Encontrados ${result.rows.length} arquivos para o usuário.`)

    const files = result.rows.map(mapFileRow)
    return c.json(files)
  } catch (error: any) {
    console.error('[Uploads] Erro critico ao listar arquivos:', error)
    return c.json({ 
      error: 'Erro ao listar arquivos do banco de dados.', 
      message: error?.message || String(error),
      code: error?.code || 'UNKNOWN',
      technical: String(error?.stack || error)
    }, 500)
  }
})

uploadRoutes.post('/files/upload', authenticateToken, async (c) => {
  const user = c.get('user')
  if (!user?.id) return c.json({ error: 'Acesso negado.' }, 401)
  
  let form: FormData
  try {
    form = await c.req.formData()
  } catch (formError: any) {
    console.error('[Uploads] Erro ao processar FormData:', formError)
    return c.json({ 
      error: 'Formato de envio invalido ou multipart corrompido.',
      technical: formError?.message || String(formError)
    }, 400)
  }

  // Debug: Listar campos recebidos
  const allFields: { key: string; isFile: boolean; type: string; size?: number }[] = []
  try {
    form.forEach((value, key) => {
      allFields.push({
        key,
        isFile: value instanceof File,
        type: value instanceof File ? value.type : typeof value,
        size: value instanceof File ? value.size : undefined
      })
    })
  } catch (logErr) {
    console.error('[Uploads] Erro ao logar campos do FormData:', logErr)
  }
  
  console.log('[Uploads] Analise do FormData recebido:', allFields)

  const filesToProcess: File[] = []
  
  // 1. Tentar campos conhecidos 'files', 'file', 'attachment', 'media'
  const knownKeys = ['files', 'file', 'attachment', 'media']
  for (const key of knownKeys) {
    const values = form.getAll(key)
    for (const val of values) {
      if (val instanceof File && val.size > 0) {
        filesToProcess.push(val)
      }
    }
  }
  
  // 2. Fallback: Qualquer campo que contenha um File com tamanho > 0
  if (filesToProcess.length === 0) {
    form.forEach((value) => {
      if (value instanceof File && value.size > 0 && !filesToProcess.includes(value)) {
        filesToProcess.push(value)
      }
    })
  }

  if (filesToProcess.length === 0) {
    console.warn('[Uploads] Nenhum arquivo valido encontrado. Campos recebidos:', allFields.map(f => f.key))
    return c.json({ 
      error: 'Nenhum arquivo valido encontrado na requisicao multipart.',
      receivedFields: allFields.map(f => f.key),
      technical: 'O backend esperava um campo com anexo (ex: "files"). Verifique se o arquivo foi realmente selecionado no frontend.'
    }, 400)
  }

  const db = getDb(c.env)
  await ensureCloudflareSchema(db)
  const results = []

  for (const file of filesToProcess) {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      console.warn(`[Uploads] Arquivo ${file.name} ignorado por tamanho excedido: ${file.size} bytes`)
      continue
    }

    const rule = resolveFileRule(file.type, file.name)
    if (!rule) {
      console.warn(`[Uploads] Arquivo ${file.name} ignorado por tipo não suportado: ${file.type}`)
      continue
    }

    const fileId = crypto.randomUUID()
    const originalName = normalizeUploadDisplayName(file.name)
    const storedName = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${originalName}`
    const publicToken = buildPublicFileToken()
    const objectKey = buildObjectKey(user.id, storedName)

    try {
      await c.env.UPLOADS_BUCKET.put(objectKey, await file.arrayBuffer(), {
        httpMetadata: {
          contentType: file.type || 'application/octet-stream',
          contentDisposition: `inline; filename="${originalName}"`,
        },
      })

      const inserted = await db.query(
        `INSERT INTO user_uploaded_files (
          id, user_id, original_name, stored_name, mime_type, extension, media_type, size_bytes, storage_path, public_token
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
        RETURNING *`,
        [
          fileId,
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
      results.push(inserted.rows[0])
    } catch (err) {
      console.error(`[Uploads] Falha ao processar arquivo ${file.name}:`, err)
    }
  }

  if (results.length === 0) {
    return c.json({ error: 'Falha ao processar uploads ou arquivos inválidos.' }, 500)
  }

  return c.json(results.length === 1 ? mapFileRow(results[0]) : results.map(mapFileRow), 201)
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
