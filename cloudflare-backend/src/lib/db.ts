import { Pool } from 'pg'
import type { Bindings } from '../types'

let pool: Pool | null = null

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isRetryableConnectionError(error: unknown) {
  const message = String((error as any)?.message || error || '').toLowerCase()
  const code = String((error as any)?.code || '').toUpperCase()

  if (
    code === 'ETIMEDOUT' ||
    code === 'ECONNRESET' ||
    code === 'ECONNREFUSED' ||
    code === 'EPIPE' ||
    code === 'DB_QUERY_TIMEOUT'
  ) return true

  return (
    message.includes('timeout exceeded when trying to connect') ||
    message.includes('connection terminated unexpectedly') ||
    message.includes('connection closed') ||
    message.includes('connect timeout') ||
    message.includes('client has encountered a connection error') ||
    message.includes('cannot use a pool after calling end on the pool') ||
    message.includes('too many clients already') ||
    message.includes('remaining connection slots are reserved')
  )
}

function isReadOnlyQuery(queryText: unknown) {
  if (typeof queryText !== 'string') return false
  const normalized = queryText.trim().toLowerCase()
  return (
    normalized.startsWith('select') ||
    normalized.startsWith('with') ||
    normalized.startsWith('show') ||
    normalized.startsWith('explain')
  )
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      const timeoutError = new Error(`DB_QUERY_TIMEOUT after ${timeoutMs}ms`)
      ;(timeoutError as any).code = 'DB_QUERY_TIMEOUT'
      reject(timeoutError)
    }, timeoutMs)

    promise
      .then((result) => resolve(result))
      .catch((error) => reject(error))
      .finally(() => clearTimeout(timer))
  })
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
    connectionTimeoutMillis: 15000,
    idle_in_transaction_session_timeout: 60000,
    keepAlive: true,
  } as any)

  ;(pool as any).on?.('error', (error: unknown) => {
    console.error('[DB] Erro no pool PostgreSQL:', error)
  })

  const originalQuery = (pool as any).query.bind(pool)
  ;(pool as any).query = async (...args: any[]) => {
    let lastError: unknown = null
    const queryText = args[0]
    const isReadOnly = isReadOnlyQuery(queryText)
    const maxAttempts = isReadOnly ? 3 : 1

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const execution = originalQuery(...args)
        return await withTimeout(execution, isReadOnly ? 12000 : 15000)
      } catch (error) {
        lastError = error
        if (!isRetryableConnectionError(error) || attempt >= maxAttempts) {
          throw error
        }

        const delay = 350 + attempt * 450
        console.warn(`[DB] Falha transitoria de conexao (tentativa ${attempt}/${maxAttempts}). Retentando em ${delay}ms...`)
        await wait(delay)
      }
    }

    throw lastError || new Error('Falha desconhecida de banco.')
  }

  return pool
}
