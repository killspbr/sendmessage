import { Hono } from 'hono'
import { SignJWT } from 'jose'
import type { Bindings, AppVariables } from '../../types'
import { AuthRepository } from './repository'
import { hashPassword, comparePassword } from '../../lib/password'
import { authenticateToken } from '../../lib/auth'

export const authRoutes = new Hono<{ Bindings: Bindings; Variables: AppVariables }>()

/**
 * Helper: Assina Token JWT
 */
async function signAuthToken(env: Bindings, payload: { id: string; email: string; tv: number }) {
  const secret = new TextEncoder().encode(String(env.JWT_SECRET || 'fallback_secret_must_be_changed'))
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret)
}

/**
 * POST /api/auth/signup
 */
authRoutes.post('/signup', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const email = String(body.email || '').trim().toLowerCase()
  const password = String(body.password || '')
  const name = String(body.name || '').trim()

  if (!email || !password) return c.json({ error: 'Email e senha são obrigatórios.' }, 400)

  // Verifica existência
  const existing = await AuthRepository.findByEmail(c.env, email)
  if (existing) return c.json({ error: 'Este e-mail já está cadastrado.' }, 400)

  // Cria usuário
  const passwordHash = await hashPassword(password)
  const user = await AuthRepository.createUser(c.env, { email, passwordHash, name: name || null })

  // Atribui grupo (Admin para o primeiro usuário)
  const totalUsers = await AuthRepository.countUsers(c.env)
  await AuthRepository.assignToGroup(c.env, user.id, totalUsers === 1 ? 'Administrador' : 'Usuário')

  const token = await signAuthToken(c.env, {
    id: String(user.id),
    email: String(user.email),
    tv: Number(user.token_version || 0),
  })

  return c.json({ user, token }, 201)
})

/**
 * POST /api/auth/login
 */
authRoutes.post('/login', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const email = String(body.email || '').trim().toLowerCase()
  const password = String(body.password || '')

  if (!email || !password) return c.json({ error: 'Credenciais inválidas.' }, 400)

  const user = await AuthRepository.findByEmail(c.env, email)
  if (!user || !user.password_hash) return c.json({ error: 'Credenciais inválidas.' }, 401)

  const valid = await comparePassword(password, user.password_hash)
  if (!valid) return c.json({ error: 'Credenciais inválidas.' }, 401)

  // Migração progressiva de hash (opcional mas mantido para compatibilidade)
  if (user.password_hash.startsWith('$2')) {
     const newHash = await hashPassword(password)
     await AuthRepository.updatePasswordHash(c.env, user.id, newHash)
  }

  const token = await signAuthToken(c.env, {
    id: String(user.id),
    email: String(user.email),
    tv: Number(user.token_version || 0),
  })

  return c.json({ 
    user: { id: user.id, email: user.email, name: user.name }, 
    token 
  })
})

/**
 * GET /api/auth/me
 */
authRoutes.get('/me', authenticateToken, async (c) => {
  const userPayload = c.get('user')
  if (!userPayload?.id) return c.json({ error: 'Não autorizado.' }, 401)
  
  const user = await AuthRepository.findById(c.env, userPayload.id)
  return c.json(user)
})
