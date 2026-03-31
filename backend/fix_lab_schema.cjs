
const { Client } = require('pg');

async function debugSchema() {
  const client = new Client({
    connectionString: "postgres://u7f09p8v6n777h:p5978c4a452fc30cb1056f709f196396e481f337b52125f9b429d29033328e752@ce9f0v870v5hnb.cluster-czrs8kj4is77.us-east-1.rds.amazonaws.com:5432/db917l8b6j666g"
  });

  try {
    await client.connect();
    console.log('Conectado ao banco para diagnostico de schema...');

    const UUID_GEN = "(md5(random()::text || clock_timestamp()::text)::uuid)";

    console.log('Tentando criar warmer_configs...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS warmer_configs (
        id UUID PRIMARY KEY DEFAULT ${UUID_GEN},
        user_id UUID,
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
    `);
    console.log('OK: warmer_configs');

    console.log('Tentando criar warmer_runs...');
    // Removendo REFERENCES users(id) temporariamente se falhar, ou verificando se a tabela users existe
    await client.query(`
      CREATE TABLE IF NOT EXISTS warmer_runs (
        id UUID PRIMARY KEY DEFAULT ${UUID_GEN},
        warmer_id UUID NOT NULL REFERENCES warmer_configs(id) ON DELETE CASCADE,
        initiated_by UUID,
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
    `);
    console.log('OK: warmer_runs');

    console.log('Tentando criar warmer_logs...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS warmer_logs (
        id BIGSERIAL PRIMARY KEY,
        warmer_id UUID NOT NULL REFERENCES warmer_configs(id) ON DELETE CASCADE,
        from_phone TEXT NOT NULL,
        to_phone TEXT NOT NULL,
        message_type TEXT DEFAULT 'text',
        content_summary TEXT,
        sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        run_id UUID REFERENCES warmer_runs(id) ON DELETE SET NULL,
        from_instance TEXT,
        to_instance TEXT,
        payload_type TEXT,
        ok BOOLEAN DEFAULT true,
        provider_status INTEGER,
        response_time_ms INTEGER,
        error_detail TEXT
      )
    `);
    console.log('OK: warmer_logs');

  } catch (err) {
    console.error('ERRO FATAL NO SCHEMA:', err);
  } finally {
    await client.end();
  }
}

debugSchema();
