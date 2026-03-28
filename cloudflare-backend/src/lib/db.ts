import { Pool } from 'pg'
import type { Bindings } from '../types'

let pool: Pool | null = null

export function getDb(env: Bindings) {
  if (pool) return pool

  const connectionString = env.HYPERDRIVE?.connectionString || env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL ou binding HYPERDRIVE nao configurado.')
  }

  pool = new Pool({
    connectionString,
    max: 5,
  })

  return pool
}
