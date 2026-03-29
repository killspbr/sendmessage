import { Hono } from 'hono'
import type { Bindings, AppVariables } from '../types'
import { authenticateToken } from '../lib/auth'
import { getDb } from '../lib/db'
import { runSchemaBestEffort } from '../lib/runtimeSchema'

function getAuthenticatedUserId(c: { get: (key: 'user') => { id?: string } | undefined }) {
  const user = c.get('user')
  return user?.id ?? null
}

function normalizeText(value: unknown, fallback = '') {
  if (value == null) return fallback
  return String(value).trim()
}

function normalizeNullableText(value: unknown) {
  if (value == null) return null
  const text = String(value).trim()
  return text.length > 0 ? text : null
}

async function ensureListsAndContactsTables(db: ReturnType<typeof getDb>) {
  await runSchemaBestEffort(async () => {
    await db.query(`
      CREATE TABLE IF NOT EXISTS lists (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `)

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_lists_user_name
        ON lists(user_id, name)
    `)

    await db.query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        list_id UUID NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        phone TEXT DEFAULT '',
        email TEXT DEFAULT '',
        category TEXT DEFAULT '',
        cep TEXT DEFAULT '',
        rating TEXT DEFAULT '',
        address TEXT DEFAULT '',
        city TEXT DEFAULT '',
        state TEXT DEFAULT '',
        instagram TEXT DEFAULT '',
        facebook TEXT DEFAULT '',
        whatsapp TEXT DEFAULT '',
        website TEXT DEFAULT '',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `)

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_contacts_user_list_name
        ON contacts(user_id, list_id, name)
    `)
  }, 'listsContacts')
}

export const listsContactsRoutes = new Hono<{ Bindings: Bindings; Variables: AppVariables }>()

listsContactsRoutes.get('/lists', authenticateToken, async (c) => {
  const userId = getAuthenticatedUserId(c)
  if (!userId) return c.json({ error: 'Acesso negado.' }, 401)
  const db = getDb(c.env)
  await ensureListsAndContactsTables(db)

  const result = await db.query(
    'SELECT * FROM lists WHERE user_id = $1 ORDER BY name ASC',
    [userId]
  )

  return c.json(result.rows)
})

listsContactsRoutes.post('/lists', authenticateToken, async (c) => {
  const userId = getAuthenticatedUserId(c)
  if (!userId) return c.json({ error: 'Acesso negado.' }, 401)
  const db = getDb(c.env)
  await ensureListsAndContactsTables(db)
  const body = await c.req.json().catch(() => ({} as Record<string, unknown>))
  const name = normalizeText(body.name)

  if (!name) return c.json({ error: 'Nome da lista é obrigatório.' }, 400)

  const result = await db.query(
    'INSERT INTO lists (user_id, name) VALUES ($1, $2) RETURNING *',
    [userId, name]
  )

  return c.json(result.rows[0], 201)
})

listsContactsRoutes.put('/lists/:id', authenticateToken, async (c) => {
  const userId = getAuthenticatedUserId(c)
  if (!userId) return c.json({ error: 'Acesso negado.' }, 401)
  const listId = c.req.param('id')
  const db = getDb(c.env)
  await ensureListsAndContactsTables(db)
  const body = await c.req.json().catch(() => ({} as Record<string, unknown>))
  const name = normalizeText(body.name)

  if (!name) return c.json({ error: 'Nome da lista é obrigatório.' }, 400)

  const result = await db.query(
    `UPDATE lists
        SET name = $1
      WHERE id = $2
        AND user_id = $3
    RETURNING *`,
    [name, listId, userId]
  )

  if (!result.rows[0]) return c.json({ error: 'Lista nao encontrada.' }, 404)
  return c.json(result.rows[0])
})

listsContactsRoutes.delete('/lists/:id', authenticateToken, async (c) => {
  const userId = getAuthenticatedUserId(c)
  if (!userId) return c.json({ error: 'Acesso negado.' }, 401)
  const listId = c.req.param('id')
  const db = getDb(c.env)
  await ensureListsAndContactsTables(db)

  await db.query('DELETE FROM lists WHERE id = $1 AND user_id = $2', [listId, userId])
  return c.json({ ok: true })
})

listsContactsRoutes.delete('/lists', authenticateToken, async (c) => {
  const userId = getAuthenticatedUserId(c)
  if (!userId) return c.json({ error: 'Acesso negado.' }, 401)
  const db = getDb(c.env)
  await ensureListsAndContactsTables(db)

  await db.query('DELETE FROM lists WHERE user_id = $1', [userId])
  return c.json({ ok: true })
})

listsContactsRoutes.get('/contacts', authenticateToken, async (c) => {
  const userId = getAuthenticatedUserId(c)
  if (!userId) return c.json({ error: 'Acesso negado.' }, 401)
  const listId = c.req.query('listId')
  const db = getDb(c.env)
  await ensureListsAndContactsTables(db)

  if (listId) {
    const result = await db.query(
      `SELECT *
         FROM contacts
        WHERE user_id = $1
          AND list_id = $2
        ORDER BY name ASC`,
      [userId, listId]
    )
    return c.json(result.rows)
  }

  const result = await db.query(
    `SELECT *
       FROM contacts
      WHERE user_id = $1
      ORDER BY name ASC`,
    [userId]
  )

  return c.json(result.rows)
})

listsContactsRoutes.post('/contacts', authenticateToken, async (c) => {
  const userId = getAuthenticatedUserId(c)
  if (!userId) return c.json({ error: 'Acesso negado.' }, 401)
  const db = getDb(c.env)
  await ensureListsAndContactsTables(db)
  const body = await c.req.json().catch(() => ({} as Record<string, unknown>))

  const listId = normalizeText(body.list_id)
  const name = normalizeText(body.name)
  const phone = normalizeText(body.phone)

  if (!listId) return c.json({ error: 'list_id é obrigatório.' }, 400)
  if (!name) return c.json({ error: 'name é obrigatório.' }, 400)

  const duplicate = await db.query(
    `SELECT id
       FROM contacts
      WHERE user_id = $1
        AND list_id = $2
        AND (name = $3 OR (phone = $4 AND phone <> ''))
      LIMIT 1`,
    [userId, listId, name, phone || '']
  )

  if (duplicate.rows.length > 0) {
    return c.json({ error: 'Contato ja existe nesta lista.' }, 409)
  }

  const result = await db.query(
    `INSERT INTO contacts (
      user_id, list_id, name, phone, email, category, cep, rating,
      address, city, state, instagram, facebook, whatsapp, website
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
    RETURNING *`,
    [
      userId,
      listId,
      name,
      phone || '',
      normalizeText(body.email),
      normalizeText(body.category),
      normalizeText(body.cep),
      normalizeText(body.rating),
      normalizeText(body.address),
      normalizeText(body.city),
      normalizeText(body.state),
      normalizeText(body.instagram),
      normalizeText(body.facebook),
      normalizeText(body.whatsapp),
      normalizeText(body.website),
    ]
  )

  return c.json(result.rows[0], 201)
})

listsContactsRoutes.put('/contacts/:id', authenticateToken, async (c) => {
  const userId = getAuthenticatedUserId(c)
  if (!userId) return c.json({ error: 'Acesso negado.' }, 401)
  const contactId = c.req.param('id')
  const db = getDb(c.env)
  await ensureListsAndContactsTables(db)
  const body = await c.req.json().catch(() => ({} as Record<string, unknown>))

  const result = await db.query(
    `UPDATE contacts SET
      name = COALESCE($1, name),
      phone = COALESCE($2, phone),
      email = COALESCE($3, email),
      category = COALESCE($4, category),
      cep = COALESCE($5, cep),
      rating = COALESCE($6, rating),
      address = COALESCE($7, address),
      city = COALESCE($8, city),
      state = COALESCE($9, state),
      instagram = COALESCE($10, instagram),
      facebook = COALESCE($11, facebook),
      whatsapp = COALESCE($12, whatsapp),
      website = COALESCE($13, website)
    WHERE id = $14 AND user_id = $15
    RETURNING *`,
    [
      normalizeNullableText(body.name),
      normalizeNullableText(body.phone),
      normalizeNullableText(body.email),
      normalizeNullableText(body.category),
      normalizeNullableText(body.cep),
      normalizeNullableText(body.rating),
      normalizeNullableText(body.address),
      normalizeNullableText(body.city),
      normalizeNullableText(body.state),
      normalizeNullableText(body.instagram),
      normalizeNullableText(body.facebook),
      normalizeNullableText(body.whatsapp),
      normalizeNullableText(body.website),
      contactId,
      userId,
    ]
  )

  if (!result.rows[0]) return c.json({ error: 'Contato nao encontrado.' }, 404)
  return c.json(result.rows[0])
})

listsContactsRoutes.delete('/contacts/:id', authenticateToken, async (c) => {
  const userId = getAuthenticatedUserId(c)
  if (!userId) return c.json({ error: 'Acesso negado.' }, 401)
  const contactId = c.req.param('id')
  const db = getDb(c.env)
  await ensureListsAndContactsTables(db)
  await db.query('DELETE FROM contacts WHERE id = $1 AND user_id = $2', [contactId, userId])
  return c.json({ ok: true })
})

listsContactsRoutes.delete('/contacts', authenticateToken, async (c) => {
  const userId = getAuthenticatedUserId(c)
  if (!userId) return c.json({ error: 'Acesso negado.' }, 401)
  const db = getDb(c.env)
  await ensureListsAndContactsTables(db)
  await db.query('DELETE FROM contacts WHERE user_id = $1', [userId])
  return c.json({ ok: true })
})
