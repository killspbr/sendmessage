import type { Bindings } from '../types'

/**
 * Utilitario de logging estruturado para Cloudflare Workers.
 * Envia logs para o Logflare (ou console como fallback).
 */

export type LogLevel = 'info' | 'warn' | 'error' | 'debug'

export interface LogEntry {
  message: string
  level: LogLevel
  timestamp?: string
  userId?: string
  route?: string
  metadata?: Record<string, any>
  error?: string
}

export async function logToService(env: Bindings, entry: LogEntry) {
  const payload = {
    ...entry,
    timestamp: entry.timestamp || new Date().toISOString(),
    environment: 'production'
  }

  // Log local sempre (ajuda no wrangler tail)
  const logPrefix = `[${payload.level.toUpperCase()}]`
  if (payload.level === 'error') {
    console.error(logPrefix, payload.message, payload.error || '', payload.metadata || '')
  } else {
    console.log(logPrefix, payload.message, payload.metadata || '')
  }

  // Se tivermos chaves do Logflare, enviamos via HTTP
  if (env.LOGFLARE_API_KEY && env.LOGFLARE_SOURCE_TOKEN) {
    try {
      // Usamos waitUntil (se disponivel no contexto do Hono/Worker) para não atrasar a resposta ao usuário
      // Nota: No worker puro o fetch externo é permitido
      const response = await fetch(`https://api.logflare.app/logs/json?source=${env.LOGFLARE_SOURCE_TOKEN}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': env.LOGFLARE_API_KEY
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        console.warn('[Logger] Logflare respondeu com erro:', response.status)
      }
    } catch (err: any) {
      console.warn('[Logger] Falha ao enviar para Logflare:', err.message)
    }
  }
}

export const logger = {
  info: (env: Bindings, message: string, meta?: Record<string, any>) => 
    logToService(env, { level: 'info', message, metadata: meta }),
  
  warn: (env: Bindings, message: string, meta?: Record<string, any>) => 
    logToService(env, { level: 'warn', message, metadata: meta }),
  
  error: (env: Bindings, message: string, error?: any, meta?: Record<string, any>) => 
    logToService(env, { 
      level: 'error', 
      message, 
      error: typeof error === 'string' ? error : (error as any)?.message || String(error),
      metadata: meta 
    }),

  debug: (env: Bindings, message: string, meta?: Record<string, any>) => 
    logToService(env, { level: 'debug', message, metadata: meta })
}
