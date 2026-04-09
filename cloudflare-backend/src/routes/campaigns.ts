import { Hono } from 'hono'
import type { Bindings, AppVariables } from '../types'
import { authenticateToken } from '../lib/auth'

export const campaignRoutes = new Hono<{ Bindings: Bindings; Variables: AppVariables }>()

// Listar campanhas
campaignRoutes.get('/campaigns', authenticateToken, async (c) => {
  try {
    const db = c.get('db')
    const page = parseInt(c.req.query('page') || '1')
    const limit = parseInt(c.req.query('limit') || '20')
    const offset = (page - 1) * limit

    const campaignQuery = `
      SELECT 
        c.*,
        l.name as list_name,
        (SELECT COUNT(*) FROM public.campaign_leads cl WHERE cl.campaign_id = c.id) as total_leads,
        (SELECT COUNT(*) FROM public.campaign_leads cl WHERE cl.campaign_id = c.id AND cl.status = 'sent') as sent_leads
      FROM public.campaigns c
      LEFT JOIN public.lists l ON c.list_id = l.id
      ORDER BY c.created_at DESC
      LIMIT $1 OFFSET $2
    `
    const countQuery = `SELECT COUNT(*)::int as count FROM public.campaigns`

    const campaigns = await db.query(campaignQuery, [limit, offset])
    const total = await db.query(countQuery)

    const totalCount = parseInt(total.rows[0]?.count || '0')

    return c.json({
      success: true,
      rows: campaigns.rows,
      meta: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit)
      }
    })
  } catch (err: any) {
    console.error('[Campaigns.list] Error:', err.message)
    return c.json({ error: 'Falha ao buscar campanhas', technical: err.message }, 500)
  }
})

// Obter detalhes de uma campanha
campaignRoutes.get('/campaigns/:id', authenticateToken, async (c) => {
  try {
    const db = c.get('db')
    const id = c.req.param('id')
    const res = await db.query('SELECT * FROM public.campaigns WHERE id = $1', [id])
    if (res.rows.length === 0) return c.json({ error: 'Campanha não encontrada' }, 404)
    return c.json({ success: true, data: res.rows[0] })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// Criar campanha
campaignRoutes.post('/campaigns', authenticateToken, async (c) => {
  try {
    const db = c.get('db')
    const body = await c.req.json()
    const { name, list_id, message, channels, scheduled_at } = body

    const res = await db.query(
      'INSERT INTO public.campaigns (name, list_id, message, channels, scheduled_at, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, list_id, message, JSON.stringify(channels || []), scheduled_at, 'pending']
    )
    return c.json({ success: true, data: res.rows[0] })
  } catch (err: any) {
    return c.json({ error: 'Falha ao criar campanha', technical: err.message }, 500)
  }
})
