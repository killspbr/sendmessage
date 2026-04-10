import { Hono } from 'hono'
import type { Bindings, AppVariables } from '../../types'
import { ProfileRepository } from './repository'
import { authenticateToken } from '../../lib/auth'

export const profileRoutes = new Hono<{ Bindings: Bindings; Variables: AppVariables }>()

/**
 * GET /api/profile/full
 * Carrega perfil e permissões.
 */
profileRoutes.get('/full', authenticateToken, async (c) => {
  const user = c.get('user')
  if (!user?.id) return c.json({ error: 'Não autorizado.' }, 401)

  const [profile, permission_codes] = await Promise.all([
    ProfileRepository.getFullProfile(c.env, user.id),
    ProfileRepository.getPermissions(c.env, user.id)
  ])

  return c.json({ ...profile, permission_codes })
})

/**
 * PUT /api/profile
 * Atualiza dados do próprio perfil.
 */
profileRoutes.put('/', authenticateToken, async (c) => {
  const user = c.get('user')
  if (!user?.id) return c.json({ error: 'Não autorizado' }, 401)
  
  const body = await c.req.json().catch(() => ({}))
  
  // Lista de campos permitidos para evitar injeção indesejada
  const allowedFields = [
    'use_global_ai', 'ai_api_key', 'evolution_url', 'evolution_apikey', 
    'evolution_instance', 'company_info', 'display_name', 'phone',
    'gemini_model', 'gemini_api_version', 'gemini_temperature', 
    'gemini_max_tokens', 'send_interval_min', 'send_interval_max'
  ]

  const updateData: any = {}
  for (const field of allowedFields) {
    if (body[field] !== undefined) updateData[field] = body[field]
  }

  await ProfileRepository.updateProfile(c.env, user.id, updateData)
  return c.json({ ok: true })
})

/**
 * GET /api/profile/settings (Global App Settings)
 */
profileRoutes.get('/settings', authenticateToken, async (c) => {
  const settings = await ProfileRepository.getAppSettings(c.env)
  return c.json(settings)
})

/**
 * POST /api/profile/settings (Admin only check logic should be added)
 */
profileRoutes.post('/settings', authenticateToken, async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const result = await ProfileRepository.updateAppSettings(c.env, body)
  return c.json(result[0] || {})
})
