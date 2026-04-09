import pg from 'pg'
import type { Bindings } from '../types'

let poolInstance: any = null

/**
 * DATABASE HANDLER PARA EASYPANEL / HYPERDRIVE
 * Focado em performance e resiliência com mecanismo de retry.
 */
function initializePool(isHyperdrive: boolean, connectionString: string) {
  const { Pool } = pg as any
  const pool = new Pool({
    connectionString: connectionString,
    max: isHyperdrive ? 10 : 1, 
    idleTimeoutMillis: 30000, 
    connectionTimeoutMillis: 5000,
    queryTimeoutMillis: 10000,
    ssl: isHyperdrive ? { rejectUnauthorized: false } : false,
  })

  pool.on('error', (err: any) => {
    console.error('[DB-Pool-Error]', err.message)
    poolInstance = null
  })

  return pool
}

export function getDb(env: Bindings) {
  const isHyperdrive = !!env.HYPERDRIVE
  const connectionString = env.DATABASE_URL || (env.HYPERDRIVE ? env.HYPERDRIVE.connectionString : null);

  if (!connectionString) {
    throw new Error('DATABASE_URL or HYPERDRIVE not configured');
  }

  return {
    async query(text: string, params?: any[], retryCount = 1): Promise<any> {
      const start = Date.now()
      
      if (!poolInstance) {
        poolInstance = initializePool(isHyperdrive, connectionString)
      }

      try {
        const result = await poolInstance.query(text, params)
        const duration = Date.now() - start
        if (duration > 5000) {
          console.warn(`[DB-Slow] ${duration}ms: ${text.substring(0, 100)}`)
        }
        return result
      } catch (error: any) {
        const duration = Date.now() - start
        const msg = String(error.message).toLowerCase()
        console.error(`[DB-Error] ${duration}ms: ${error.message} (Retry: ${retryCount}, Path: ${text.substring(0, 50)})`)
        
        // Se for erro de conexão/timeout e ainda tiver retries, tenta denovo resetando o pool
        if ((msg.includes('connection') || msg.includes('timeout') || msg.includes('pool') || msg.includes('terminated')) && retryCount > 0) {
          console.warn('[DB-Retry] Resetting pool and retrying...')
          poolInstance = null
          return this.query(text, params, retryCount - 1)
        }
        
        throw error
      }
    },
    async execute<T = any>(text: string, params?: any[]): Promise<T[]> {
      const result = await this.query(text, params)
      return result.rows
    }
  }
}
