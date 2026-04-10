import pg from 'pg'
import type { Bindings } from '../types'

/**
 * Singleton Database Client (SendMessage 2.0)
 * Gerencia a conexão com o PostgreSQL através do Pool do Hyperdrive.
 * Focado em performance e resiliência.
 */
class DatabaseClient {
  private static instance: DatabaseClient
  private pool: any = null

  private constructor() {}

  public static getInstance(): DatabaseClient {
    if (!DatabaseClient.instance) {
      DatabaseClient.instance = new DatabaseClient()
    }
    return DatabaseClient.instance
  }

  /**
   * Inicializa o pool de conexões se necessário.
   */
  private getPool(env: Bindings): any {
    if (this.pool) return this.pool

    const { Pool } = pg as any
    const isHyperdrive = !!env.HYPERDRIVE
    const connectionString = env.DATABASE_URL || (env.HYPERDRIVE ? env.HYPERDRIVE.connectionString : null)

    if (!connectionString) {
      throw new Error('DATABASE_URL or HYPERDRIVE connection string missing')
    }

    this.pool = new Pool({
      connectionString,
      max: isHyperdrive ? 10 : 1,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      queryTimeoutMillis: 10000,
      ssl: isHyperdrive ? { rejectUnauthorized: false } : false,
    })

    this.pool.on('error', (err: any) => {
      console.error('[DB-Pool-Error]', err.message)
      this.pool = null // Reseta o pool para ser recriado no próximo request
    })

    return this.pool
  }

  /**
   * Executa uma query SQL com mecanismo de retry integrado para falhas de rede.
   */
  public async query(env: Bindings, text: string, params: any[] = [], retryCount = 1): Promise<any> {
    const pool = this.getPool(env)
    const start = Date.now()

    try {
      const result = await pool.query(text, params)
      const duration = Date.now() - start
      
      if (duration > 5000) {
        console.warn(`[DB-Slow] ${duration}ms: ${text.substring(0, 100)}`)
      }
      
      return result
    } catch (error: any) {
      const duration = Date.now() - start
      const msg = String(error.message).toLowerCase()
      
      console.error(`[DB-Error] ${duration}ms: ${error.message}`)

      // Retry logic para falhas transientes
      const shouldRetry = (
        msg.includes('connection') || 
        msg.includes('timeout') || 
        msg.includes('pool') || 
        msg.includes('terminated')
      ) && retryCount > 0

      if (shouldRetry) {
        console.warn('[DB-Retry] Resetting pool and retrying query...')
        this.pool = null
        return this.query(env, text, params, retryCount - 1)
      }

      throw error
    }
  }

  /**
   * Atalho para retornar apenas as linhas (rows).
   */
  public async execute<T = any>(env: Bindings, text: string, params: any[] = []): Promise<T[]> {
    const result = await this.query(env, text, params)
    return result.rows
  }
}

export const db = DatabaseClient.getInstance()
