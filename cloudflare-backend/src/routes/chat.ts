import { Hono } from 'hono'
import type { Bindings, AppVariables } from '../types'
import { authenticateToken } from '../lib/auth'
import { getDb } from '../lib/db'

export const chatRoutes = new Hono<{ Bindings: Bindings; Variables: AppVariables }>()

/**
 * GET /api/chat/labels/:instance
 * Busca labels de uma instancia especifica na Evolution API
 */
chatRoutes.get('/labels/:instance', authenticateToken, async (c) => {
  const instance = c.req.param('instance')
  const db = getDb(c.env)
  
  // 1. Busca configuracoes da Evolution
  const settings = await db.query('SELECT evolution_url, evolution_key FROM public.settings LIMIT 1')
  if (settings.rows.length === 0) {
    return c.json({ error: 'Configure a Evolution API nas definicoes primeiro.' }, 400)
  }

  const { evolution_url, evolution_key } = settings.rows[0]
  if (!evolution_url || !evolution_key) {
    return c.json({ error: 'Evolution URL ou Key nao configurada.' }, 400)
  }

  const url = `${evolution_url.replace(/\/$/, '')}/chat/findLabels/${instance}`

  try {
    const response = await fetch(url, {
      headers: {
        'apikey': evolution_key,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}))
      return c.json({ error: 'Erro ao buscar labels na Evolution.', details: errBody }, response.status as any)
    }

    const data = await response.json()
    return c.json(data)
  } catch (error: any) {
    return c.json({ error: 'Falha na comunicacao com a Evolution.', technical: error.message }, 500)
  }
})

/**
 * GET /api/chat/groups/:instance
 * Busca todos os grupos de uma instancia (Evolution v2)
 */
chatRoutes.get('/groups/:instance', authenticateToken, async (c) => {
  const instance = c.req.param('instance')
  const db = getDb(c.env)
  
  const settings = await db.query('SELECT evolution_url, evolution_key FROM public.settings LIMIT 1')
  if (settings.rows.length === 0) return c.json({ error: 'Configuracao ausente.' }, 400)

  const { evolution_url, evolution_key } = settings.rows[0]
  const url = `${evolution_url.replace(/\/$/, '')}/group/fetchAllGroups/${instance}?getParticipants=false`

  try {
    const response = await fetch(url, {
      headers: { 'apikey': evolution_key }
    })
    const data = await response.json()
    return c.json(data)
  } catch (error: any) {
    return c.json({ error: error.message }, 500)
  }
})
