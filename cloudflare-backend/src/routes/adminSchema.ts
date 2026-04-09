import { Hono } from 'hono'
import { getDb } from '../lib/db'
import { authenticateToken, checkAdmin } from '../lib/auth'

export const adminSchemaRoutes = new Hono()

adminSchemaRoutes.get('/admin/schema/sync', async (c) => {
  const db = getDb(c.env)
  const logs: string[] = []

  const run = async (name: string, sql: string) => {
    try {
      await db.query(sql)
      logs.push(`✅ [${name}] Sucesso`)
    } catch (err: any) {
      logs.push(`❌ [${name}] Falha: ${err.message}`)
    }
  }

  logs.push('🚀 Iniciando Sincronização Atômica de Schema V2...')

  const UUID_GEN = "(md5(random()::text || clock_timestamp()::text)::uuid)"

  // 1. RBAC Basico
  await run('user_groups', `CREATE TABLE IF NOT EXISTS public.user_groups (id UUID PRIMARY KEY DEFAULT ${UUID_GEN}, name TEXT UNIQUE, created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP)`)
  await run('permissions', `CREATE TABLE IF NOT EXISTS public.permissions (id UUID PRIMARY KEY DEFAULT ${UUID_GEN}, code TEXT UNIQUE, description TEXT, created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP)`)
  await run('permissions_col_desc', `ALTER TABLE public.permissions ADD COLUMN IF NOT EXISTS description TEXT`)
  
  await run('group_permissions', `CREATE TABLE IF NOT EXISTS public.group_permissions (group_id UUID REFERENCES public.user_groups(id) ON DELETE CASCADE, permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE, PRIMARY KEY (group_id, permission_id))`)
  
  // Seed Groups
  await run('seed_group_admin', `INSERT INTO public.user_groups (name) VALUES ('Administrador') ON CONFLICT DO NOTHING`)
  await run('seed_group_user', `INSERT INTO public.user_groups (name) VALUES ('Usuário') ON CONFLICT DO NOTHING`)

  // Seed Permissions
  const basePerms = [
    ['dashboard.view', 'Ver dashboard'],
    ['contacts.view', 'Ver contatos'],
    ['contacts.edit', 'Editar contatos'],
    ['campaigns.view', 'Ver campanhas'],
    ['campaigns.create', 'Criar campanhas'],
    ['history.view', 'Ver histórico'],
    ['settings.view', 'Ver configurações'],
    ['admin.*', 'Acesso total de administrador']
  ]
  for (const [code, desc] of basePerms) {
    await run(`perm_${code}`, `INSERT INTO public.permissions (code, description) VALUES ('${code}', '${desc}') ON CONFLICT (code) DO NOTHING`)
  }

  // Vincular permissões ao grupo Usuário (tudo menos admin.*)
  await run('link_user_perms', `
    INSERT INTO public.group_permissions (group_id, permission_id)
    SELECT g.id, p.id 
    FROM public.user_groups g, public.permissions p
    WHERE g.name = 'Usuário' AND p.code != 'admin.*'
    ON CONFLICT DO NOTHING
  `)

  // Vincular admin.* ao Administrador
  await run('link_admin_perms', `
    INSERT INTO public.group_permissions (group_id, permission_id)
    SELECT g.id, p.id 
    FROM public.user_groups g, public.permissions p
    WHERE g.name = 'Administrador' AND p.code = 'admin.*'
    ON CONFLICT DO NOTHING
  `)

  // 2. Perfis e Configs
  await run('user_profiles', `
    CREATE TABLE IF NOT EXISTS public.user_profiles (
      id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
      display_name TEXT,
      phone TEXT,
      group_id UUID REFERENCES public.user_groups(id),
      use_global_ai BOOLEAN DEFAULT true,
      ai_api_key TEXT,
      company_info TEXT,
      evolution_url TEXT,
      evolution_apikey TEXT,
      evolution_instance TEXT,
      daily_message_limit INTEGER,
      monthly_message_limit INTEGER,
      upload_quota_bytes BIGINT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // 3. Listas e Contatos
  await run('lists', `CREATE TABLE IF NOT EXISTS public.lists (id UUID PRIMARY KEY DEFAULT ${UUID_GEN}, user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE, name TEXT NOT NULL, created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP)`)
  await run('contacts', `
    CREATE TABLE IF NOT EXISTS public.contacts (
      id UUID PRIMARY KEY DEFAULT ${UUID_GEN},
      user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
      list_id UUID NOT NULL REFERENCES public.lists(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      phone TEXT DEFAULT '',
      email TEXT DEFAULT '',
      category TEXT DEFAULT '',
      cep TEXT DEFAULT '',
      rating TEXT DEFAULT '',
      address TEXT DEFAULT '',
      city TEXT DEFAULT '',
      state TEXT DEFAULT '',
      instagram TEXT DEFAULT '',
      facebook TEXT DEFAULT '',
      whatsapp TEXT DEFAULT '',
      website TEXT DEFAULT '',
      labels JSONB DEFAULT '[]',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // 4. Campanhas
  await run('campaigns', `
    CREATE TABLE IF NOT EXISTS public.campaigns (
      id UUID PRIMARY KEY DEFAULT ${UUID_GEN},
      user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
      list_id UUID REFERENCES public.lists(id),
      name TEXT NOT NULL,
      message TEXT,
      channels JSONB DEFAULT '[]',
      status TEXT DEFAULT 'pending',
      scheduled_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `)
  await run('campaigns_col_scheduled', `ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMP WITH TIME ZONE`)
  await run('campaigns_col_updated_at', `ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`)
  
  // campaign_leads com criação robusta (sem FK inicialmente se falhar, depois tenta adicionar)
  await run('campaign_leads_table', `
    CREATE TABLE IF NOT EXISTS public.campaign_leads (
      id UUID PRIMARY KEY DEFAULT ${UUID_GEN},
      campaign_id UUID NOT NULL,
      contact_id UUID,
      phone TEXT,
      status TEXT DEFAULT 'pending',
      sent_at TIMESTAMP WITH TIME ZONE,
      error_detail TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `)
  
  // Tentar adicionar as FKs separadamente para evitar erro de criação atômica
  await run('campaign_leads_fk_campaign', `ALTER TABLE public.campaign_leads ADD CONSTRAINT campaign_leads_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id) ON DELETE CASCADE`)
  await run('campaign_leads_fk_contact', `ALTER TABLE public.campaign_leads ADD CONSTRAINT campaign_leads_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE SET NULL`)

  // 5. Historico
  await run('contact_send_history', `
    CREATE TABLE IF NOT EXISTS public.contact_send_history (
      id UUID PRIMARY KEY DEFAULT ${UUID_GEN},
      user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
      campaign_id UUID,
      campaign_name TEXT,
      contact_name TEXT,
      phone_key TEXT,
      channel TEXT,
      ok BOOLEAN DEFAULT false,
      status INTEGER,
      webhook_ok BOOLEAN DEFAULT false,
      provider_status TEXT,
      error_detail TEXT,
      payload_raw JSONB,
      delivery_summary JSONB,
      run_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // 6. Maturação (Warmer)
  await run('warmer_configs', `
    CREATE TABLE IF NOT EXISTS public.warmer_configs (
      id UUID PRIMARY KEY DEFAULT ${UUID_GEN},
      user_id UUID,
      name TEXT,
      instance_a_id TEXT NOT NULL,
      instance_b_id TEXT NOT NULL,
      phone_a TEXT NOT NULL,
      phone_b TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      default_delay_seconds INTEGER DEFAULT 30,
      default_messages_per_run INTEGER DEFAULT 10,
      ai_persona TEXT,
      last_run_status TEXT,
      last_run_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // 7. AI Pool
  await run('gemini_api_keys', `CREATE TABLE IF NOT EXISTS public.gemini_api_keys (id UUID PRIMARY KEY DEFAULT ${UUID_GEN}, api_key TEXT UNIQUE, status TEXT DEFAULT 'ativa', requests_count INTEGER DEFAULT 0, created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP)`)
  await run('gemini_api_usage_logs', `CREATE TABLE IF NOT EXISTS public.gemini_api_usage_logs (id BIGSERIAL PRIMARY KEY, user_id UUID, source TEXT, model TEXT, tokens_count INTEGER, status_code INTEGER, data_solicitacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP)`)

  // Garanter permissoes FINAIS
  await run('grant_schema', `GRANT ALL ON SCHEMA public TO clrodriguesuser`)
  await run('grant_public_tables', `GRANT ALL ON ALL TABLES IN SCHEMA public TO clrodriguesuser`)
  await run('grant_sequences', `GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO clrodriguesuser`)

  // Promoção de emergência do usuário de homologação
  await run('promote_homolog', `
    UPDATE public.user_profiles 
       SET group_id = (SELECT id FROM public.user_groups WHERE name = 'Administrador' LIMIT 1)
     WHERE id = (SELECT id FROM public.users WHERE email = 'homologacao_final@exemplo.com' LIMIT 1)
  `)

  return c.json({ logs })
})
