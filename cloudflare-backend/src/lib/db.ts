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
    message.includes('connect timeout') ||
    message.includes('query read timeout') ||
    message.includes('statement timeout')
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
    max: 15,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
    query_timeout: 10000,
    statement_timeout: 10000,
    idle_in_transaction_session_timeout: 10000,
    keepAlive: true,
  } as any)

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
        console.warn(`[DB] Falha transitoria de conexao (tentativa ${attempt}/3). Retentando em ${delay}ms...`)
        await wait(delay)
      }
    }

    throw lastError || new Error('Falha desconhecida de banco.')
  }

  return pool
}
