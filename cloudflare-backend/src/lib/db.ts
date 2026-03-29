import { Pool } from 'pg'
import type { Bindings } from '../types'

let pool: Pool | null = null

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isRetryableConnectionError(error: unknown) {
  const message = String((error as any)?.message || error || '').toLowerCase()
  const code = String((error as any)?.code || '').toUpperCase()

  if (code === 'ETIMEDOUT' || code === 'ECONNRESET' || code === 'ECONNREFUSED') return true

  return (
    message.includes('timeout exceeded when trying to connect') ||
    message.includes('connection terminated unexpectedly') ||
    message.includes('connection closed') ||
    message.includes('connect timeout')
  )
}

export function getDb(env: Bindings) {
  if (pool) return pool

  const connectionString = env.HYPERDRIVE?.connectionString || env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL ou binding HYPERDRIVE nao configurado.')
  }

  pool = new Pool({
    connectionString,
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  })

  // Evita crash por erro assíncrono de cliente ocioso no pool.
  ;(pool as any).on?.('error', (error: unknown) => {
    console.error('[DB] Erro no pool PostgreSQL:', error)
  })

  const originalQuery = (pool as any).query.bind(pool)
  ;(pool as any).query = async (...args: any[]) => {
    let lastError: unknown = null

    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        return await originalQuery(...args)
      } catch (error) {
        lastError = error
        if (!isRetryableConnectionError(error) || attempt >= 3) {
          throw error
        }

        const delay = attempt * 300
        console.warn(`[DB] Falha transitória de conexão (tentativa ${attempt}/3). Retentando em ${delay}ms...`)
        await wait(delay)
      }
    }

    throw lastError || new Error('Falha desconhecida de banco.')
  }

  return pool
}
