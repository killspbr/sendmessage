import pg from 'pg'
const { Pool } = pg as any
import type { Bindings } from '../types'

let poolInstance: any = null
let poolConnKey = ''
let poolInstanceGeneration = 0

function getPool(connectionString: string) {
  if (!poolInstance || poolConnKey !== connectionString) {
    // New connection string = create new pool
    poolConnKey = connectionString
    poolInstance = new Pool({
      connectionString,
      max: 10,
      min: 0,
      idleTimeoutMillis: 15_000,
      connectionTimeoutMillis: 10_000,
      maxUses: 100,
    })
    poolInstanceGeneration++
  }
  return { pool: poolInstance, generation: poolInstanceGeneration }
}

export function getDb(env: Bindings) {
  const connectionString = env.HYPERDRIVE?.connectionString || env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL ou binding HYPERDRIVE nao configurado.')
  }

  return {
    async query(text: string, params?: any[]) {
      const { pool: primaryPool, generation } = getPool(connectionString)

      try {
        return await primaryPool.query(text, params)
      } catch (primaryErr: any) {
        // If first query fails, recreate pool and try once more
        console.warn('[DB] Pool falhou, tentando recriar pool:', primaryErr.message)
        poolInstance = null
        poolConnKey = ''

        const { pool: freshPool } = getPool(connectionString)
        return await freshPool.query(text, params)
      }
    }
  }
}
