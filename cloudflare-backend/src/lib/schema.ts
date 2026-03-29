import type { Pool } from 'pg'

const ENABLE_RUNTIME_SCHEMA_ENSURE = true
let schemaEnsureAttempted = false

function isSkippableSchemaError(error: unknown) {
  const message = String((error as any)?.message || error || '').toLowerCase()
  return (
    message.includes('permission denied') ||
    message.includes('must be owner') ||
    message.includes('insufficient privilege') ||
    (message.includes('gen_random_uuid') && message.includes('does not exist'))
  )
}

export async function ensureCloudflareSchema(db: any) {
  if (!ENABLE_RUNTIME_SCHEMA_ENSURE) return
  if (schemaEnsureAttempted) return
  schemaEnsureAttempted = true

  const UUID_GEN = "(md5(random()::text || clock_timestamp()::text)::uuid)"

  try {
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
        id UUID PRIMARY KEY DEFAULT ${UUID_GEN},
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
      CREATE TABLE IF NOT EXISTS warmer_configs (
        id UUID PRIMARY KEY DEFAULT ${UUID_GEN},
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT,
        instance_a_id TEXT NOT NULL,
        instance_b_id TEXT NOT NULL,
        phone_a TEXT NOT NULL,
        phone_b TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'error')),
        default_delay_seconds INTEGER DEFAULT 5,
        default_messages_per_run INTEGER DEFAULT 4,
        sample_image_url TEXT,
        sample_document_url TEXT,
        sample_audio_url TEXT,
        notes TEXT,
        last_run_status TEXT,
        last_run_error TEXT,
        last_run_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `)

    await db.query(`
      CREATE TABLE IF NOT EXISTS warmer_runs (
        id UUID PRIMARY KEY DEFAULT ${UUID_GEN},
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

    await db.query(`
      CREATE TABLE IF NOT EXISTS warmer_logs (
        id BIGSERIAL PRIMARY KEY,
        warmer_id UUID NOT NULL REFERENCES warmer_configs(id) ON DELETE CASCADE,
        run_id UUID REFERENCES warmer_runs(id) ON DELETE SET NULL,
        from_phone TEXT NOT NULL,
        to_phone TEXT NOT NULL,
        from_instance TEXT,
        to_instance TEXT,
        message_type TEXT DEFAULT 'text',
        payload_type TEXT,
        content_summary TEXT,
        ok BOOLEAN DEFAULT true,
        provider_status INTEGER,
        response_time_ms INTEGER,
        error_detail TEXT,
        sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `)
  } catch (error) {
    if (isSkippableSchemaError(error)) {
      console.warn('[CloudflareSchema] Aviso: sem permissao para garantir schema automaticamente. Prosseguindo sem migracao no runtime.')
      return
    }

    throw error
  }
}
