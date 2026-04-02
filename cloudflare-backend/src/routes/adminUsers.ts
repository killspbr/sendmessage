import { Hono } from 'hono'
import bcrypt from 'bcryptjs'
import type { Bindings, AppVariables } from '../types'
import { authenticateToken, checkAdmin } from '../lib/auth'
import { getDb } from '../lib/db'
import { runBestEffortDdl } from '../lib/ddl'
import { toEvolutionNumber } from '../lib/messageUtils'

const DEFAULT_GROUPS = ['Administrador', 'Gerente', 'Operador', 'Visualizador']

const DEFAULT_PERMISSIONS: Array<{ code: string; name: string; description: string }> = [
  { code: 'dashboard.view', name: 'Dashboard', description: 'Visualizar dashboard' },
  { code: 'contacts.view', name: 'Contatos', description: 'Visualizar contatos' },
  { code: 'contacts.create', name: 'Contatos (Criar)', description: 'Criar contatos' },
  { code: 'contacts.edit', name: 'Contatos (Editar)', description: 'Editar contatos e listas' },
  { code: 'contacts.delete', name: 'Contatos (Excluir)', description: 'Excluir contatos' },
  { code: 'contacts.import', name: 'Contatos (Importar)', description: 'Importar contatos via CSV' },
  { code: 'contacts.export', name: 'Contatos (Exportar)', description: 'Exportar contatos' },
  { code: 'campaigns.view', name: 'Campanhas', description: 'Visualizar campanhas' },
  { code: 'campaigns.create', name: 'Campanhas (Criar)', description: 'Criar campanhas' },
  { code: 'campaigns.edit', name: 'Campanhas (Editar)', description: 'Editar campanhas' },
  { code: 'campaigns.delete', name: 'Campanhas (Excluir)', description: 'Excluir campanhas' },
  { code: 'campaigns.send', name: 'Campanhas (Enviar)', description: 'Enviar campanhas' },
  { code: 'settings.view', name: 'Configuracoes', description: 'Visualizar configuracoes' },
  { code: 'settings.edit', name: 'Configuracoes (Editar)', description: 'Editar configuracoes' },
  { code: 'admin.users', name: 'Admin (Usuarios)', description: 'Gerenciar usuarios' },
  { code: 'admin.groups', name: 'Admin (Grupos)', description: 'Gerenciar grupos e permissoes' },
  { code: 'admin.audit', name: 'Admin (Auditoria)', description: 'Auditoria e seguranca' },
  { code: 'backup.export', name: 'Backup (Exportar)', description: 'Exportar backup' },
  { code: 'backup.import', name: 'Backup (Importar)', description: 'Importar backup' },
]

const ROLE_PERMISSION_MATRIX: Record<string, string[]> = {
  Administrador: DEFAULT_PERMISSIONS.map((item) => item.code),
  Gerente: [
    'dashboard.view',
    'contacts.view',
    'contacts.create',
    'contacts.edit',
    'contacts.import',
    'contacts.export',
    'campaigns.view',
    'campaigns.create',
    'campaigns.edit',
    'campaigns.send',
    'settings.view',
    'settings.edit',
  ],
  Operador: [
    'dashboard.view',
    'contacts.view',
    'contacts.create',
    'contacts.edit',
    'contacts.import',
    'campaigns.view',
    'campaigns.create',
    'campaigns.edit',
    'campaigns.send',
    'settings.view',
  ],
  Visualizador: [
    'dashboard.view',
    'contacts.view',
    'campaigns.view',
    'settings.view',
  ],
}

async function ensureAdminUsersTables(db: ReturnType<typeof getDb>) {
  await runBestEffortDdl(db, 'adminUsers.ensureAdminUsersTables', [
    `
      CREATE TABLE IF NOT EXISTS public.user_groups (
        id UUID PRIMARY KEY DEFAULT (md5(random()::text || clock_timestamp()::text)::uuid),
        name TEXT UNIQUE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `,
    `
      CREATE TABLE IF NOT EXISTS public.permissions (
        id UUID PRIMARY KEY DEFAULT (md5(random()::text || clock_timestamp()::text)::uuid),
        code TEXT UNIQUE NOT NULL,
        name TEXT,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `,
    `
      CREATE TABLE IF NOT EXISTS public.group_permissions (
        group_id UUID NOT NULL REFERENCES public.user_groups(id) ON DELETE CASCADE,
        permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
        PRIMARY KEY (group_id, permission_id)
      )
    `,
    `
      CREATE TABLE IF NOT EXISTS public.user_profiles (
        id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
        display_name TEXT,
        phone TEXT,
        group_id UUID REFERENCES public.user_groups(id) ON DELETE SET NULL,
        use_global_ai BOOLEAN DEFAULT true,
        ai_api_key TEXT,
        company_info TEXT,
        evolution_url TEXT,
        evolution_apikey TEXT,
        evolution_instance TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `,
    `
      CREATE TABLE IF NOT EXISTS public.app_settings (
        id SERIAL PRIMARY KEY,
        global_ai_api_key TEXT,
        evolution_api_url TEXT,
        evolution_api_key TEXT,
        evolution_shared_instance TEXT,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `,
    `ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS display_name TEXT`,
    `ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS phone TEXT`,
    `ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES public.user_groups(id) ON DELETE SET NULL`,
    `ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS use_global_ai BOOLEAN DEFAULT true`,
    `ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS ai_api_key TEXT`,
    `ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS company_info TEXT`,
    `ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS evolution_url TEXT`,
    `ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS evolution_apikey TEXT`,
    `ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS evolution_instance TEXT`,
    `ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`,
    `ALTER TABLE public.permissions ADD COLUMN IF NOT EXISTS description TEXT`,
  ])
}

async function ensureAdminSeeds(db: ReturnType<typeof getDb>) {
  const groupsCount = await db.query('SELECT COUNT(*)::int AS total FROM public.user_groups')
  if (Number(groupsCount.rows[0]?.total || 0) === 0) {
    for (const groupName of DEFAULT_GROUPS) {
      await db.query('INSERT INTO public.user_groups (name) VALUES ($1) ON CONFLICT (name) DO NOTHING', [groupName])
    }
  }

  const permissionsCount = await db.query('SELECT COUNT(*)::int AS total FROM public.permissions')
  if (Number(permissionsCount.rows[0]?.total || 0) === 0) {
    for (const permission of DEFAULT_PERMISSIONS) {
      await db.query(
        `INSERT INTO public.permissions (code, name, description)
         VALUES ($1, $2, $3)
         ON CONFLICT (code) DO NOTHING`,
        [permission.code, permission.name, permission.description]
      )
    }
  }

  const groupPermissionCount = await db.query('SELECT COUNT(*)::int AS total FROM public.group_permissions')
  if (Number(groupPermissionCount.rows[0]?.total || 0) > 0) return

  const [groupRows, permissionRows] = await Promise.all([
    db.query('SELECT id, name FROM public.user_groups'),
    db.query('SELECT id, code FROM public.permissions'),
  ])

  const groupIdByName = new Map<string, string>()
  for (const row of groupRows.rows) {
    groupIdByName.set(String(row.name), String(row.id))
  }

  const permissionIdByCode = new Map<string, string>()
  for (const row of permissionRows.rows) {
    permissionIdByCode.set(String(row.code), String(row.id))
  }

  for (const [groupName, permissionCodes] of Object.entries(ROLE_PERMISSION_MATRIX)) {
    const groupId = groupIdByName.get(groupName)
    if (!groupId) continue

    for (const code of permissionCodes) {
      const permissionId = permissionIdByCode.get(code)
      if (!permissionId) continue
      await db.query(
        `INSERT INTO public.group_permissions (group_id, permission_id)
         VALUES ($1, $2)
         ON CONFLICT (group_id, permission_id) DO NOTHING`,
        [groupId, permissionId]
      )
    }
  }
}

function normalizeEvolutionBaseUrl(url: unknown) {
  return String(url || '').trim().replace(/\/+$/, '')
}

function normalizeNullableText(value: unknown) {
  if (value === undefined) return undefined
  const normalized = String(value ?? '').trim()
  return normalized || null
}

export const adminUsersRoutes = new Hono<{ Bindings: Bindings; Variables: AppVariables }>()

adminUsersRoutes.get('/permissions/me', authenticateToken, async (c) => {
  const user = c.get('user')
  if (!user?.id) return c.json({ error: 'Acesso negado.' }, 401)

  const db = getDb(c.env)
  await ensureAdminUsersTables(db)
  await ensureAdminSeeds(db)

  const result = await db.query(
    `SELECT p.code
       FROM public.user_profiles up
       JOIN public.group_permissions gp ON gp.group_id = up.group_id
       JOIN public.permissions p ON p.id = gp.permission_id
      WHERE up.id = $1`,
    [user.id]
  )

  return c.json(result.rows.map((row: { code: string }) => row.code))
})

adminUsersRoutes.get('/admin/users', authenticateToken, checkAdmin, async (c) => {
  const db = getDb(c.env)
  await ensureAdminUsersTables(db)
  await ensureAdminSeeds(db)

  const result = await db.query(
    `SELECT
       u.id,
       up.display_name,
       up.phone,
       up.group_id,
       up.use_global_ai,
       ug.name AS group_name,
       u.name AS user_name,
       u.email
     FROM public.users u
     LEFT JOIN public.user_profiles up ON up.id = u.id
     LEFT JOIN public.user_groups ug ON ug.id = up.group_id
     ORDER BY COALESCE(up.display_name, u.name, u.email, u.id::text) ASC`
  )

  return c.json(result.rows)
})

adminUsersRoutes.put('/admin/users/:id/profile', authenticateToken, checkAdmin, async (c) => {
  const db = getDb(c.env)
  await ensureAdminUsersTables(db)
  await ensureAdminSeeds(db)

  const id = String(c.req.param('id') || '').trim()
  const body = await c.req.json().catch(() => ({} as Record<string, unknown>))

  if (!id) return c.json({ error: 'Usuario invalido.' }, 400)

  const displayName = normalizeNullableText(body.display_name)
  const phone = normalizeNullableText(body.phone)
  const email = normalizeNullableText(body.email)

  try {
    await db.query('BEGIN')
    await db.query(
      `INSERT INTO public.user_profiles (id, display_name, phone)
       VALUES ($1, $2, $3)
       ON CONFLICT (id) DO UPDATE SET
         display_name = EXCLUDED.display_name,
         phone = EXCLUDED.phone`,
      [id, displayName ?? null, phone ?? null]
    )

    if (displayName !== undefined) {
      await db.query('UPDATE public.users SET name = $1 WHERE id = $2', [displayName, id])
    }

    if (email !== undefined) {
      await db.query('UPDATE public.users SET email = $1 WHERE id = $2', [email, id])
    }

    await db.query('COMMIT')
  } catch (error: any) {
    await db.query('ROLLBACK')
    const message = String(error?.message || '')
    if (message.toLowerCase().includes('duplicate key') && message.toLowerCase().includes('users_email_key')) {
      return c.json({ error: 'Ja existe um usuario com esse e-mail.' }, 409)
    }
    throw error
  }

  const result = await db.query(
    `SELECT
       u.id,
       up.display_name,
       up.phone,
       up.group_id,
       up.use_global_ai,
       ug.name AS group_name,
       u.name AS user_name,
       u.email
     FROM public.users u
     LEFT JOIN public.user_profiles up ON up.id = u.id
     LEFT JOIN public.user_groups ug ON ug.id = up.group_id
     WHERE u.id = $1
     LIMIT 1`,
    [id]
  )

  return c.json(result.rows[0] || { ok: true })
})

adminUsersRoutes.get('/admin/groups', authenticateToken, checkAdmin, async (c) => {
  const db = getDb(c.env)
  await ensureAdminUsersTables(db)
  await ensureAdminSeeds(db)
  const result = await db.query('SELECT * FROM public.user_groups ORDER BY name ASC')
  return c.json(result.rows)
})

adminUsersRoutes.get('/admin/permissions', authenticateToken, checkAdmin, async (c) => {
  const db = getDb(c.env)
  await ensureAdminUsersTables(db)
  await ensureAdminSeeds(db)
  const result = await db.query('SELECT * FROM public.permissions ORDER BY code ASC')
  return c.json(result.rows)
})

adminUsersRoutes.get('/admin/group-permissions', authenticateToken, checkAdmin, async (c) => {
  const db = getDb(c.env)
  await ensureAdminUsersTables(db)
  await ensureAdminSeeds(db)
  const result = await db.query('SELECT * FROM public.group_permissions')
  return c.json(result.rows)
})

adminUsersRoutes.post('/admin/group-permissions', authenticateToken, checkAdmin, async (c) => {
  const db = getDb(c.env)
  await ensureAdminUsersTables(db)
  await ensureAdminSeeds(db)
  const body = await c.req.json().catch(() => ({} as Record<string, unknown>))
  const groupId = String(body.group_id || '').trim()
  const permissionId = String(body.permission_id || '').trim()

  if (!groupId || !permissionId) {
    return c.json({ error: 'group_id e permission_id sao obrigatorios.' }, 400)
  }

  await db.query(
    `INSERT INTO public.group_permissions (group_id, permission_id)
     VALUES ($1, $2)
     ON CONFLICT (group_id, permission_id) DO NOTHING`,
    [groupId, permissionId]
  )

  return c.json({ ok: true })
})

adminUsersRoutes.delete('/admin/group-permissions', authenticateToken, checkAdmin, async (c) => {
  const db = getDb(c.env)
  await ensureAdminUsersTables(db)
  await ensureAdminSeeds(db)
  const body = await c.req.json().catch(() => ({} as Record<string, unknown>))
  const groupId = String(body.group_id || '').trim()
  const permissionId = String(body.permission_id || '').trim()

  if (!groupId || !permissionId) {
    return c.json({ error: 'group_id e permission_id sao obrigatorios.' }, 400)
  }

  await db.query('DELETE FROM public.group_permissions WHERE group_id = $1 AND permission_id = $2', [groupId, permissionId])
  return c.json({ ok: true })
})

adminUsersRoutes.put('/admin/users/:id/group', authenticateToken, checkAdmin, async (c) => {
  const db = getDb(c.env)
  await ensureAdminUsersTables(db)
  await ensureAdminSeeds(db)

  const id = String(c.req.param('id') || '').trim()
  const body = await c.req.json().catch(() => ({} as Record<string, unknown>))
  const groupIdRaw = body.group_id
  const groupId = groupIdRaw == null || String(groupIdRaw).trim() === '' ? null : String(groupIdRaw).trim()

  if (!id) return c.json({ error: 'Usuario invalido.' }, 400)

  await db.query('INSERT INTO public.user_profiles (id) VALUES ($1) ON CONFLICT (id) DO NOTHING', [id])
  await db.query('UPDATE public.user_profiles SET group_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [groupId, id])

  return c.json({ ok: true })
})

adminUsersRoutes.put('/admin/users/:id/settings', authenticateToken, checkAdmin, async (c) => {
  const db = getDb(c.env)
  await ensureAdminUsersTables(db)
  await ensureAdminSeeds(db)

  const id = String(c.req.param('id') || '').trim()
  const body = await c.req.json().catch(() => ({} as Record<string, unknown>))

  if (!id) return c.json({ error: 'Usuario invalido.' }, 400)

  const updates: Array<{ column: string; value: unknown }> = []
  const pushUpdate = (column: string, bodyKey: string) => {
    if (body[bodyKey] !== undefined) {
      updates.push({ column, value: body[bodyKey] })
    }
  }

  pushUpdate('use_global_ai', 'use_global_ai')
  pushUpdate('display_name', 'display_name')
  pushUpdate('evolution_url', 'evolution_url')
  pushUpdate('evolution_apikey', 'evolution_apikey')
  pushUpdate('evolution_instance', 'evolution_instance')
  pushUpdate('company_info', 'company_info')

  if (body.evolution_api_key !== undefined && body.evolution_apikey === undefined) {
    updates.push({ column: 'evolution_apikey', value: body.evolution_api_key })
  }

  if (updates.length === 0) {
    return c.json({ error: 'Nenhum campo valido fornecido.' }, 400)
  }

  await db.query('INSERT INTO public.user_profiles (id) VALUES ($1) ON CONFLICT (id) DO NOTHING', [id])

  const assignments = updates.map((entry, index) => `${entry.column} = $${index + 1}`)
  const values = updates.map((entry) => entry.value)
  assignments.push(`updated_at = CURRENT_TIMESTAMP`)
  values.push(id)

  await db.query(`UPDATE public.user_profiles SET ${assignments.join(', ')} WHERE id = $${values.length}`, values)
  return c.json({ ok: true })
})

adminUsersRoutes.post('/admin/users/:id/reset-password', authenticateToken, checkAdmin, async (c) => {
  const db = getDb(c.env)
  const id = String(c.req.param('id') || '').trim()
  if (!id) return c.json({ success: false, error: 'Usuario invalido.' }, 400)

  const defaultPassword = '123456'
  const passwordHash = await bcrypt.hash(defaultPassword, 10)

  const result = await db.query(
    `UPDATE public.users
        SET password_hash = $1,
            reset_password_token = NULL,
            reset_password_expires = NULL,
            token_version = COALESCE(token_version, 0) + 1
      WHERE id = $2
      RETURNING id`,
    [passwordHash, id]
  )

  if (result.rows.length === 0) {
    return c.json({ success: false, error: 'Usuario nao encontrado.' }, 404)
  }

  return c.json({
    success: true,
    message: `Senha do usuario resetada para "${defaultPassword}" e sessoes invalidadas.`,
  })
})

adminUsersRoutes.post('/admin/users/:id/invalidate-sessions', authenticateToken, checkAdmin, async (c) => {
  const db = getDb(c.env)
  const id = String(c.req.param('id') || '').trim()
  if (!id) return c.json({ success: false, error: 'Usuario invalido.' }, 400)

  const result = await db.query(
    `UPDATE public.users
        SET token_version = COALESCE(token_version, 0) + 1
      WHERE id = $1
      RETURNING id`,
    [id]
  )

  if (result.rows.length === 0) {
    return c.json({ success: false, error: 'Usuario nao encontrado.' }, 404)
  }

  return c.json({ success: true, message: 'Sessoes do usuario invalidadas com sucesso.' })
})

adminUsersRoutes.post('/admin/invalidate-all-sessions', authenticateToken, checkAdmin, async (c) => {
  const db = getDb(c.env)
  await db.query('UPDATE public.users SET token_version = COALESCE(token_version, 0) + 1')
  return c.json({ success: true, message: 'Sessoes de todos os usuarios invalidadas com sucesso.' })
})

adminUsersRoutes.post('/admin/users/:id/notify', authenticateToken, checkAdmin, async (c) => {
  const authUser = c.get('user')
  if (!authUser?.id) return c.json({ error: 'Acesso negado.' }, 401)

  const db = getDb(c.env)
  await ensureAdminUsersTables(db)
  const id = String(c.req.param('id') || '').trim()
  const body = await c.req.json().catch(() => ({} as Record<string, unknown>))
  const message = String(body.message || '').trim()

  if (!id) return c.json({ error: 'Usuario invalido.' }, 400)
  if (!message) return c.json({ error: 'Mensagem e obrigatoria.' }, 400)

  const [targetUserResult, adminProfileResult, globalSettingsResult] = await Promise.all([
    db.query(
      `SELECT
         up.phone,
         COALESCE(up.display_name, u.name, u.email, u.id::text) AS user_label
       FROM public.users u
       LEFT JOIN public.user_profiles up ON up.id = u.id
       WHERE u.id = $1
       LIMIT 1`,
      [id]
    ),
    db.query(
      `SELECT
         evolution_url,
         evolution_apikey,
         evolution_instance
       FROM public.user_profiles
       WHERE id = $1
       LIMIT 1`,
      [authUser.id]
    ),
    db.query(
      `SELECT
         evolution_api_url,
         evolution_api_key,
         evolution_shared_instance
       FROM public.app_settings
       ORDER BY id DESC
       LIMIT 1`
    ),
  ])

  const targetUser = targetUserResult.rows[0]
  if (!targetUser?.phone) {
    return c.json({ error: 'Usuario alvo nao possui telefone cadastrado.' }, 400)
  }

  const adminProfile = adminProfileResult.rows[0] || {}
  const globalSettings = globalSettingsResult.rows[0] || {}

  const evolutionUrl = normalizeEvolutionBaseUrl(adminProfile.evolution_url || globalSettings.evolution_api_url || '')
  const evolutionApiKey = String(adminProfile.evolution_apikey || globalSettings.evolution_api_key || '').trim()
  const evolutionInstance = String(adminProfile.evolution_instance || globalSettings.evolution_shared_instance || '').trim()

  if (!evolutionUrl || !evolutionApiKey || !evolutionInstance) {
    return c.json({ error: 'Evolution API nao configurada para notificacoes administrativas.' }, 400)
  }

  const evolutionNumber = toEvolutionNumber(targetUser.phone)
  if (!evolutionNumber) {
    return c.json({ error: 'Telefone do usuario esta em formato invalido.' }, 400)
  }

  const response = await fetch(`${evolutionUrl}/message/sendText/${evolutionInstance}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: evolutionApiKey,
    },
    body: JSON.stringify({
      number: evolutionNumber,
      text: message,
      linkPreview: false,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    return c.json({ error: `Falha ao enviar pela Evolution API: ${errorText || `HTTP ${response.status}`}` }, 502)
  }

  return c.json({ ok: true, target: targetUser.user_label || id })
})
