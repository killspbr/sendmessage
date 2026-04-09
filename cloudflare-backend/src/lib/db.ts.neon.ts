import pg from 'pg'
import type { Bindings } from '../types'

let poolInstance: any = null

/**
 * DATABASE HANDLER PARA NEON POSTGRES
 * Otimizado para arquitetura serverless do Cloudflare Workers.
 */
export function getDb(env: Bindings) {
  // Se DATABASE_URL estiver presente, damos preferencia ao Neon
  // Caso contrario, tentamos Hyperdrive (legado)
  const connectionString = env.DATABASE_URL || env.HYPERDRIVE?.connectionString;

  if (!connectionString) {
    throw new Error('DATABASE_URL or HYPERDRIVE not configured');
  }

  if (!poolInstance) {
    const { Pool } = pg as any
    poolInstance = new Pool({
      connectionString: connectionString,
      // Neon com pooler aguenta muitas conexoes, mas no Worker 
      // cada worker instance deve manter 1 conexao para rapidez.
      max: 1, 
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    })

    poolInstance.on('error', (err: Error) => {
      console.error('[DB-Pool-Error] Erro inesperado:', err.message)
      poolInstance = null
    })
  }

  const currentPool = poolInstance

  return {
    async query(text: string, params?: any[]) {
      try {
        return await currentPool.query(text, params)
      } catch (error: any) {
        console.error('[DB-Query-Error]', error.message)
        if (error.message.includes('Pool is closed') || error.message.includes('terminating connection')) {
          poolInstance = null
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
