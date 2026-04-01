import { Hono } from 'hono'
import { getDb } from '../lib/db'
import { authenticateToken } from '../lib/auth'
import type { Bindings, AppVariables } from '../types'

export const statusRoutes = new Hono<{ Bindings: Bindings; Variables: AppVariables }>()

export const CURRENT_VERSION = {
  commit: 'Stabilizer-v1.1.4',
  timestamp: '2026-03-31T22:55:00-03:00',
  message: 'Estabilização de Database: SCHEMA PRF (Hyperdrive Ready) (v1.1.4)',
}

statusRoutes.get('/version', (c) => {
  return c.json({ ...CURRENT_VERSION, status: 'ONLINE', time: new Date().toISOString() })
})

statusRoutes.get('/debug-errors', async (c) => {
  try {
    const { getDb } = await import('../lib/db');
    const db = getDb(c.env);
    if (!db) return c.json({ error: "No DB" }, 500);
    const result = await db.query('SELECT run_at, status, provider_status, error_detail, payload_raw FROM public.contact_send_history ORDER BY run_at DESC LIMIT 5');
    return c.json(result.rows);
  } catch(e: any) {
    return c.json({ error: e.message }, 500);
  }
})

statusRoutes.get('/_migration-status', (c) => {
  return c.json({
    ok: true,
    runtime: 'cloudflare-workers',
    version: 2,
    timestamp: new Date().toISOString(),
  })
})

statusRoutes.get('/api/status/evo-test', authenticateToken, async (c) => {
  const userId = c.get('user')?.id
  if (!userId) return c.json({ error: 'Auth required' }, 401)
  
  const db = getDb(c.env)
  const [profileResult, globalSettingsResult] = await Promise.all([
    db.query('SELECT evolution_url, evolution_apikey, evolution_instance FROM public.user_profiles WHERE id = $1 LIMIT 1', [userId]),
    db.query('SELECT evolution_api_url, evolution_api_key, evolution_shared_instance FROM public.app_settings ORDER BY id DESC LIMIT 1'),
  ])

  const profile = profileResult.rows[0] || {}
  const globalSettings = globalSettingsResult.rows[0] || {}

  const url = String(profile.evolution_url || globalSettings.evolution_api_url || '').trim()
  const apiKey = String(profile.evolution_apikey || globalSettings.evolution_api_key || '').trim()
  const instance = String(profile.evolution_instance || globalSettings.evolution_shared_instance || '').trim()

  if (!url || !apiKey || !instance) {
    return c.json({ error: 'Config missing', url, apiKey: !!apiKey, instance })
  }

  try {
    const start = Date.now()
    const response = await fetch(`${url.replace(/\/$/, '')}/instance/fetchInstances/${instance}`, {
      headers: { apikey: apiKey }
    })
    const duration = Date.now() - start
    const data = await response.json().catch(() => ({ text: 'failed to parse' }))
    
    return c.json({ 
      ok: response.ok, 
      status: response.status, 
      duration: `${duration}ms`, 
      data,
      configUsed: { url, instance, apiKeyPrefix: apiKey.substring(0, 5) }
    })
  } catch (err) {
    return c.json({ ok: false, error: String(err) }, 500)
  }
})
