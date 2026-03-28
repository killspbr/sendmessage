import type { Pool } from 'pg'

export async function ensureCloudflareSchema(db: Pool) {
  await db.query(`
    CREATE TABLE IF NOT EXISTS active_user_sessions (
      session_id TEXT PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      current_page TEXT,
      user_agent TEXT,
      last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_active_user_sessions_last_seen_at
    ON active_user_sessions(last_seen_at DESC)
  `)

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_active_user_sessions_user_last_seen_at
    ON active_user_sessions(user_id, last_seen_at DESC)
  `)

  await db.query(`
    CREATE TABLE IF NOT EXISTS user_uploaded_files (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      original_name TEXT NOT NULL,
      stored_name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      extension TEXT NOT NULL,
      media_type TEXT NOT NULL,
      size_bytes BIGINT NOT NULL,
      storage_path TEXT NOT NULL,
      public_token TEXT NOT NULL UNIQUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP WITH TIME ZONE
    )
  `)

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_user_uploaded_files_user_created_at
    ON user_uploaded_files(user_id, created_at DESC)
  `)

  await db.query(`
    CREATE TABLE IF NOT EXISTS active_user_sessions_cf_migration (
      id SERIAL PRIMARY KEY,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `)

  await db.query(`
    CREATE TABLE IF NOT EXISTS warmer_runs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      warmer_id UUID NOT NULL REFERENCES warmer_configs(id) ON DELETE CASCADE,
      initiated_by UUID REFERENCES users(id) ON DELETE SET NULL,
      status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'completed', 'failed')),
      steps_total INTEGER NOT NULL DEFAULT 1,
      steps_completed INTEGER NOT NULL DEFAULT 0,
      step_delay_seconds INTEGER NOT NULL DEFAULT 5,
      preferred_start_side TEXT CHECK (preferred_start_side IN ('a', 'b')),
      last_error TEXT,
      started_at TIMESTAMP WITH TIME ZONE,
      finished_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `)
}
