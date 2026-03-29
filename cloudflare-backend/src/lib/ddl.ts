import type { Pool } from 'pg'

const ensureAttempted = new Set<string>()
const ENABLE_RUNTIME_DDL = false

function normalizeErrorMessage(error: unknown) {
  return String((error as { message?: unknown })?.message || error || '').toLowerCase()
}

export function isSchemaPermissionError(error: unknown) {
  const message = normalizeErrorMessage(error)
  return (
    message.includes('permission denied') ||
    message.includes('must be owner') ||
    message.includes('insufficient privilege')
  )
}

export function isSchemaMissingError(error: unknown) {
  const message = normalizeErrorMessage(error)
  return (
    message.includes('does not exist') ||
    message.includes('undefined table') ||
    message.includes('undefined column') ||
    message.includes('undefined function')
  )
}

export async function runBestEffortDdl(db: Pool, key: string, statements: string[]) {
  if (!ENABLE_RUNTIME_DDL) return
  if (ensureAttempted.has(key)) return
  ensureAttempted.add(key)

  for (const statement of statements) {
    try {
      await db.query(statement)
    } catch (error) {
      if (isSchemaPermissionError(error)) {
        console.warn(`[DDL] Sem permissao para executar "${key}". Prosseguindo sem DDL no runtime.`)
        return
      }

      console.warn(`[DDL] Falha ao executar passo de "${key}". Prosseguindo.`, error)
    }
  }
}
