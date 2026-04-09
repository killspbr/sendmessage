export const NEON_BASELINE_SCHEMA = `
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabelas basicas
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT,
  token_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY,
  display_name TEXT,
  group_id UUID,
  use_global_ai BOOLEAN DEFAULT true,
  use_global_webhooks BOOLEAN DEFAULT true,
  webhook_whatsapp_url TEXT,
  webhook_email_url TEXT,
  evolution_url TEXT,
  evolution_apikey TEXT,
  evolution_instance TEXT,
  company_info TEXT,
  ai_api_key TEXT,
  gemini_model TEXT DEFAULT 'gemini-1.5-flash-latest',
  gemini_api_version TEXT DEFAULT 'v1',
  gemini_temperature NUMERIC DEFAULT 0.7,
  gemini_max_tokens INTEGER DEFAULT 1024,
  send_interval_min INTEGER DEFAULT 30,
  send_interval_max INTEGER DEFAULT 90,
  phone TEXT,
  daily_message_limit INTEGER,
  monthly_message_limit INTEGER,
  upload_quota_bytes BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.app_settings (
  id SERIAL PRIMARY KEY,
  global_ai_api_key TEXT,
  global_webhook_whatsapp_url TEXT,
  global_webhook_email_url TEXT,
  gemini_model TEXT DEFAULT 'gemini-1.5-flash-latest',
  gemini_api_version TEXT DEFAULT 'v1',
  gemini_temperature NUMERIC DEFAULT 0.7,
  gemini_max_tokens INTEGER DEFAULT 1024,
  send_interval_min INTEGER DEFAULT 30,
  send_interval_max INTEGER DEFAULT 90,
  evolution_api_url TEXT,
  evolution_api_key TEXT,
  evolution_shared_instance TEXT,
  google_maps_api_key TEXT,
  default_daily_message_limit INTEGER DEFAULT 300,
  default_monthly_message_limit INTEGER DEFAULT 9000,
  default_upload_quota_bytes BIGINT DEFAULT 104857600,
  global_gemini_daily_limit INTEGER DEFAULT 5000,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id),
  name TEXT NOT NULL,
  status TEXT DEFAULT 'rascunho',
  channels JSONB,
  list_name TEXT,
  message TEXT,
  interval_min_seconds INTEGER DEFAULT 30,
  interval_max_seconds INTEGER DEFAULT 90,
  variations JSONB DEFAULT '[]',
  last_scheduled_at TIMESTAMP WITH TIME ZONE,
  delivery_payload JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.contacts (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.users(id),
  list_id UUID,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  category TEXT DEFAULT 'Geral',
  cep TEXT,
  rating TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  instagram TEXT,
  facebook TEXT,
  whatsapp TEXT,
  website TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes basicos
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON public.campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON public.contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_lists_user_id ON public.lists(user_id);
`;
