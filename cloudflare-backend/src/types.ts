import type { Pool } from 'pg'

export type Bindings = {
  HYPERDRIVE?: Hyperdrive
  UPLOADS_BUCKET: R2Bucket
  DATABASE_URL?: string
  JWT_SECRET: string
  GEMINI_API_KEY?: string
  GOOGLE_MAPS_API_KEY?: string
  WEBHOOK_EMAIL?: string
  SYSTEM_TIMEZONE?: string
  SYSTEM_TIMEZONE_LABEL?: string
  ACTIVE_USER_WINDOW_SECONDS?: string
}

export type AppVariables = {
  db: { query: (text: string, params?: any[]) => Promise<any> }
  user?: {
    id: string
    email?: string
    tv?: number
  }
}
