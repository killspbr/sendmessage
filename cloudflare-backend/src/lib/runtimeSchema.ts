export function isSkippableRuntimeSchemaError(error: unknown) {
  const message = String((error as any)?.message || error || '').toLowerCase()
  return (
    message.includes('permission denied') ||
    message.includes('insufficient privilege') ||
    message.includes('must be owner') ||
    (message.includes('gen_random_uuid') && message.includes('does not exist'))
  )
}

export async function runSchemaBestEffort(task: () => Promise<void>, context: string) {
  try {
    await task()
  } catch (error) {
    if (isSkippableRuntimeSchemaError(error)) {
      console.warn(`[RuntimeSchema:${context}] sem permissao/funcao para DDL runtime; seguindo sem migracao automatica.`)
      return
    }
    throw error
  }
}
