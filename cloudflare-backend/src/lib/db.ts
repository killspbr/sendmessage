import pg from 'pg'
const { Pool } = pg as any
import type { Bindings } from '../types'

// Not using global pool because Cloudflare isolates don't always handle it well with Hyperdrive.
// Instead, we use Hyperdrive's built-in pooling by opening/closing connections quickly or using a very slim wrapper.

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
    message.includes('server connection attempt failed') ||
    message.includes('connection refused') ||
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

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  let timer: any
  const timeoutPromise = new Promise<T>((_, reject) => {
    timer = setTimeout(() => {
      const timeoutError = new Error(`DB_QUERY_TIMEOUT after ${timeoutMs}ms`)
      ;(timeoutError as any).code = 'DB_QUERY_TIMEOUT'
      reject(timeoutError)
    }, timeoutMs)
  })

  try {
    return await Promise.race([promise, timeoutPromise])
  } finally {
    clearTimeout(timer)
  }
}

let dbInstance: { query: (text: string, params?: any[]) => Promise<any> } | null = null
let poolInstance: any = null
let poolConnKey = ''

function getPool(connectionString: string) {
  if (!poolInstance || poolConnKey !== connectionString) {
    poolConnKey = connectionString
    poolInstance = new Pool({
      connectionString,
      max: 10,
      min: 1,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 8_000,
      maxUses: 500,
    })
  }
  return poolInstance
}

export function getDb(env: Bindings) {
  if (dbInstance) return dbInstance

  const connectionString = env.HYPERDRIVE?.connectionString || env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL ou binding HYPERDRIVE nao configurado.')
  }

  dbInstance = {
    async query(text: string, params?: any[]) {
      const isReadOnly = isReadOnlyQuery(text)
      const maxAttempts = isReadOnly ? 2 : 1
      let lastError: any = null

      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        const pool = getPool(connectionString)

        try {
          const result = await withTimeout(pool.query(text, params), isReadOnly ? 20000 : 25000)
          return result
        } catch (error) {
          lastError = error
          
          if (!isRetryableConnectionError(error) || attempt >= maxAttempts) {
            throw error
          }

          // Recria pool para limpar conexões possivelmente corrompidas.
          try {
            await pool.end()
          } catch {}
          poolInstance = null
          poolConnKey = ''

          const delay = 100 + attempt * 200
          console.warn(`[DB] Latencia/Instabilidade detectada (${attempt}/${maxAttempts}). Retentando em ${delay}ms...`)
          await wait(delay)
        }
      }
      throw lastError || new Error('Falha de banco.')
    }
  }

  return dbInstance
}
