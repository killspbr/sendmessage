import { Hono } from 'hono'
import type { Bindings, AppVariables } from '../types'
import { authenticateToken } from '../lib/auth'
import { getDb } from '../lib/db'

type GooglePlacesTextResult = {
  place_id?: string
  name?: string
  formatted_address?: string
  vicinity?: string
  rating?: number
  user_ratings_total?: number
  types?: string[]
  geometry?: {
    location?: { lat?: number; lng?: number }
  }
}

function mapPlace(place: GooglePlacesTextResult) {
  return {
    place_id: place.place_id || '',
    name: place.name || '',
    address: place.formatted_address || place.vicinity || '',
    rating: place.rating ?? null,
    total_ratings: place.user_ratings_total || 0,
    category: place.types?.[0]?.replace(/_/g, ' ') || 'Estabelecimento',
    location: place.geometry?.location || null,
    phone: null,
    website: null,
  }
}

async function getMapsApiKey(db: ReturnType<typeof getDb>, env: Bindings) {
  try {
    const settingsResult = await db.query('SELECT google_maps_api_key FROM public.app_settings ORDER BY id DESC LIMIT 1')
    const settingsKey = String(settingsResult.rows[0]?.google_maps_api_key || '').trim()
    const envKey = String(env.GOOGLE_MAPS_API_KEY || '').trim()
    return settingsKey || envKey || null
  } catch (err) {
    console.error('[getMapsApiKey] Erro ao buscar chave da API:', err)
    return String(env.GOOGLE_MAPS_API_KEY || '').trim() || null
  }
}

export const extractMapsRoutes = new Hono<{ Bindings: Bindings; Variables: AppVariables }>()

extractMapsRoutes.post('/extract/maps/search', authenticateToken, async (c) => {
  const body = await c.req.json().catch(() => ({} as Record<string, unknown>))
  const searchTerm = String(body.query || '').trim()
  const location = String(body.location || '').trim()

  if (!searchTerm || !location) {
    return c.json({ error: 'query e location sao obrigatorios.' }, 400)
  }

  const db = getDb(c.env)
  const apiKey = await getMapsApiKey(db, c.env)
  if (!apiKey) {
    return c.json({ error: 'Chave da Google Maps API nao configurada. Acesse Configuracoes para adicionar.' }, 400)
  }

  const searchQuery = encodeURIComponent(`${searchTerm} em ${location}`)
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${searchQuery}&language=pt-BR&region=br&key=${apiKey}`
  const response = await fetch(url)
  const data = await response.json().catch(() => ({} as Record<string, unknown>))

  const status = String((data as any).status || '')
  if (status && status !== 'OK' && status !== 'ZERO_RESULTS') {
    return c.json(
      {
        error: `Erro na API do Google Maps: ${status}`,
        details: (data as any).error_message || null,
      },
      400
    )
  }

  const places = Array.isArray((data as any).results)
    ? (data as any).results.map((item: GooglePlacesTextResult) => mapPlace(item))
    : []

  return c.json({
    places,
    nextPageToken: (data as any).next_page_token || null,
  })
})

extractMapsRoutes.post('/extract/maps/next-page', authenticateToken, async (c) => {
  const body = await c.req.json().catch(() => ({} as Record<string, unknown>))
  const pageToken = String(body.pageToken || '').trim()
  if (!pageToken) return c.json({ error: 'pageToken e obrigatorio.' }, 400)

  const db = getDb(c.env)
  const apiKey = await getMapsApiKey(db, c.env)
  if (!apiKey) {
    return c.json({ error: 'Chave da Google Maps API nao configurada.' }, 400)
  }

  await new Promise((resolve) => setTimeout(resolve, 2100))

  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?pagetoken=${encodeURIComponent(pageToken)}&key=${apiKey}`
  const response = await fetch(url)
  const data = await response.json().catch(() => ({} as Record<string, unknown>))

  const status = String((data as any).status || '')
  if (status && status !== 'OK' && status !== 'ZERO_RESULTS') {
    return c.json(
      {
        error: `Erro na API do Google Maps: ${status}`,
        details: (data as any).error_message || null,
      },
      400
    )
  }

  const places = Array.isArray((data as any).results)
    ? (data as any).results.map((item: GooglePlacesTextResult) => mapPlace(item))
    : []

  return c.json({
    places,
    nextPageToken: (data as any).next_page_token || null,
  })
})

extractMapsRoutes.get('/extract/maps/details/:placeId', authenticateToken, async (c) => {
  const placeId = String(c.req.param('placeId') || '').trim()
  if (!placeId) return c.json({ error: 'placeId e obrigatorio.' }, 400)

  const db = getDb(c.env)
  const apiKey = await getMapsApiKey(db, c.env)
  if (!apiKey) {
    return c.json({ error: 'Chave da Google Maps API nao configurada.' }, 400)
  }

  const fields = 'name,formatted_phone_number,international_phone_number,website,formatted_address,rating,types'
  const url =
    `https://maps.googleapis.com/maps/api/place/details/json` +
    `?place_id=${encodeURIComponent(placeId)}` +
    `&fields=${encodeURIComponent(fields)}` +
    `&language=pt-BR` +
    `&key=${apiKey}`

  const response = await fetch(url)
  const data = await response.json().catch(() => ({} as Record<string, unknown>))
  const status = String((data as any).status || '')

  if (status !== 'OK') {
    return c.json({ error: `Erro ao buscar detalhes: ${status || 'UNKNOWN_ERROR'}` }, 400)
  }

  const result = (data as any).result || {}
  return c.json({
    place_id: placeId,
    name: result.name || '',
    phone: result.international_phone_number || result.formatted_phone_number || null,
    phone_local: result.formatted_phone_number || null,
    website: result.website || null,
    address: result.formatted_address || null,
    rating: result.rating ?? null,
    category: result.types?.[0]?.replace(/_/g, ' ') || 'Estabelecimento',
  })
})
