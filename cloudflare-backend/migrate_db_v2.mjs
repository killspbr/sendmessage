import pg from 'pg';
const { Client } = pg;

const client = new Client({ 
  user: 'cf_hyperdrive',
  host: 'easypanel.soepinaobasta.com',
  database: 'sendmessage',
  password: 'CfHyper2026Safe',
  port: 5433,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  
  const execute = async (sql) => {
    console.log(`Executing: ${sql.substring(0, 100)}...`);
    try {
      await client.query(sql);
      console.log(' - OK');
    } catch (e) {
      console.warn(` - ERROR: ${e.message}`);
    }
  };

  console.log('--- STARTING MIGRATION ---');

  // 1. Update Campaigns
  await execute('ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()');
  // Se created_at já existir (como vimos no audit), o IF NOT EXISTS ignora.
  await execute('ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW()');
  
  // Converter channels para JSONB se for ARRAY (ou qualquer tipo que não seja JSONB)
  // Nota: USING to_jsonb(channels) funciona bem para ARRAY[]
  await execute('ALTER TABLE public.campaigns ALTER COLUMN channels TYPE JSONB USING to_jsonb(channels)');

  // 2. User Profiles and Permissions
  await execute(`
    CREATE TABLE IF NOT EXISTS public.user_groups (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL UNIQUE,
      code TEXT NOT NULL UNIQUE,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await execute(`
    CREATE TABLE IF NOT EXISTS public.permissions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await execute(`
    CREATE TABLE IF NOT EXISTS public.group_permissions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      group_id UUID REFERENCES public.user_groups(id) ON DELETE CASCADE,
      permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE,
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(group_id, permission_id)
    )
  `);

  await execute(`
    CREATE TABLE IF NOT EXISTS public.user_profiles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
      group_id UUID REFERENCES public.user_groups(id),
      full_name TEXT,
      phone TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // 3. Warmer Schema
  await execute(`
    CREATE TABLE IF NOT EXISTS public.warmer_configs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      threshold INTEGER DEFAULT 10,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await execute(`
    CREATE TABLE IF NOT EXISTS public.warmer_runs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      config_id UUID REFERENCES public.warmer_configs(id) ON DELETE CASCADE,
      status TEXT DEFAULT 'running',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await execute(`
    CREATE TABLE IF NOT EXISTS public.warmer_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      run_id UUID REFERENCES public.warmer_runs(id) ON DELETE CASCADE,
      message TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  console.log('--- MIGRATION FINISHED ---');
  await client.end();
}

run().catch(console.error);
