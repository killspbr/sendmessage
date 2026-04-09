
-- BASE_NEON_SCHEMA.sql
-- Proposito: Schema baseline para Neon Postgres (SendMessage)
-- Gerado em: 2026-04-09T00:36:01.063Z

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: users
CREATE TABLE IF NOT EXISTS public.users (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  reset_password_token TEXT,
  reset_password_expires TIMESTAMP WITH TIME ZONE,
  token_version INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- Table: campaigns
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  user_id UUID,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'rascunho'::text,
  channels JSONB,
  list_name TEXT,
  message TEXT,
  interval_min_seconds INTEGER DEFAULT 30,
  interval_max_seconds INTEGER DEFAULT 90,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  variations JSONB DEFAULT '[]'::jsonb,
  last_scheduled_at TIMESTAMP WITH TIME ZONE,
  delivery_payload JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON public.campaigns(user_id);

-- Table: warmer_runs
CREATE TABLE IF NOT EXISTS public.warmer_runs (
  id UUID NOT NULL DEFAULT (md5(((random())::text || (clock_timestamp())::text)))::uuid,
  warmer_id UUID NOT NULL,
  initiated_by UUID,
  status TEXT NOT NULL DEFAULT 'queued'::text,
  steps_total INTEGER NOT NULL DEFAULT 1,
  steps_completed INTEGER NOT NULL DEFAULT 0,
  step_delay_seconds INTEGER NOT NULL DEFAULT 5,
  preferred_start_side TEXT,
  last_error TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  finished_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);


-- Table: campaign_history
CREATE TABLE IF NOT EXISTS public.campaign_history (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  user_id UUID,
  campaign_id UUID,
  status INTEGER,
  ok BOOLEAN DEFAULT false,
  total INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  run_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_campaign_history_user_id ON public.campaign_history(user_id);

-- Table: app_settings
CREATE TABLE IF NOT EXISTS public.app_settings (
  id SERIAL,
  global_ai_api_key TEXT,
  global_webhook_whatsapp_url TEXT,
  global_webhook_email_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  gemini_model TEXT DEFAULT 'gemini-1.5-flash-latest'::text,
  gemini_api_version TEXT DEFAULT 'v1'::text,
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
  PRIMARY KEY (id)
);


-- Table: user_profiles
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID NOT NULL,
  display_name TEXT,
  group_id UUID,
  use_global_ai BOOLEAN DEFAULT true,
  use_global_webhooks BOOLEAN DEFAULT true,
  webhook_whatsapp_url TEXT,
  webhook_email_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  evolution_url TEXT,
  evolution_apikey TEXT,
  evolution_instance TEXT,
  company_info TEXT,
  ai_api_key TEXT,
  gemini_model TEXT DEFAULT 'gemini-1.5-flash-latest'::text,
  gemini_api_version TEXT DEFAULT 'v1'::text,
  gemini_temperature NUMERIC DEFAULT 0.7,
  gemini_max_tokens INTEGER DEFAULT 1024,
  send_interval_min INTEGER DEFAULT 30,
  send_interval_max INTEGER DEFAULT 90,
  phone TEXT,
  daily_message_limit INTEGER,
  monthly_message_limit INTEGER,
  upload_quota_bytes BIGINT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);


-- Table: contact_send_history
CREATE TABLE IF NOT EXISTS public.contact_send_history (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  user_id UUID,
  campaign_id UUID,
  campaign_name TEXT,
  contact_name TEXT,
  phone_key TEXT,
  channel TEXT,
  ok BOOLEAN DEFAULT false,
  status INTEGER,
  webhook_ok BOOLEAN DEFAULT false,
  run_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  provider_status TEXT,
  error_detail TEXT,
  payload_raw JSONB,
  delivery_summary JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_contact_send_history_user_id ON public.contact_send_history(user_id);

-- Table: active_user_sessions
CREATE TABLE IF NOT EXISTS public.active_user_sessions (
  session_id TEXT NOT NULL,
  user_id UUID NOT NULL,
  current_page TEXT,
  user_agent TEXT,
  last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (session_id)
);

CREATE INDEX IF NOT EXISTS idx_active_user_sessions_user_id ON public.active_user_sessions(user_id);

-- Table: scheduler_logs
CREATE TABLE IF NOT EXISTS public.scheduler_logs (
  id SERIAL,
  event TEXT NOT NULL,
  details TEXT,
  data_evento TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);


-- Table: gemini_api_keys
CREATE TABLE IF NOT EXISTS public.gemini_api_keys (
  id SERIAL,
  user_id UUID,
  nome TEXT NOT NULL,
  api_key TEXT NOT NULL,
  status TEXT DEFAULT 'ativa'::text,
  ultimo_uso TIMESTAMP WITH TIME ZONE,
  requests_count INTEGER DEFAULT 0,
  data_cadastro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_gemini_api_keys_user_id ON public.gemini_api_keys(user_id);

-- Table: gemini_api_usage_logs
CREATE TABLE IF NOT EXISTS public.gemini_api_usage_logs (
  id SERIAL,
  key_id INTEGER,
  user_id INTEGER,
  module TEXT,
  resultado TEXT,
  erro TEXT,
  data_solicitacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  source TEXT DEFAULT 'global-pool'::text,
  key_label TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_gemini_api_usage_logs_user_id ON public.gemini_api_usage_logs(user_id);

-- Table: whatsapp_reputation
CREATE TABLE IF NOT EXISTS public.whatsapp_reputation (
  id SERIAL,
  user_id UUID NOT NULL,
  score INTEGER DEFAULT 50,
  level TEXT DEFAULT 'NOVO'::text,
  volume_24h INTEGER DEFAULT 0,
  failure_rate NUMERIC DEFAULT 0.00,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_reputation_user_id ON public.whatsapp_reputation(user_id);

-- Table: contacts
CREATE TABLE IF NOT EXISTS public.contacts (
  id BIGSERIAL,
  user_id UUID,
  list_id UUID,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  category TEXT DEFAULT 'Geral'::text,
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
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON public.contacts(user_id);

-- Table: campaign_schedule
CREATE TABLE IF NOT EXISTS public.campaign_schedule (
  id SERIAL,
  campaign_id UUID NOT NULL,
  user_id UUID NOT NULL,
  data_inicio DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  limite_diario INTEGER DEFAULT 300,
  intervalo_minimo INTEGER DEFAULT 30,
  intervalo_maximo INTEGER DEFAULT 90,
  mensagens_por_lote INTEGER DEFAULT 45,
  tempo_pausa_lote INTEGER DEFAULT 15,
  status TEXT DEFAULT 'agendado'::text,
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  pause_reason TEXT,
  pause_details TEXT,
  paused_at TIMESTAMP WITH TIME ZONE,
  resumed_at TIMESTAMP WITH TIME ZONE,
  scheduler_claimed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_campaign_schedule_user_id ON public.campaign_schedule(user_id);

-- Table: user_groups
CREATE TABLE IF NOT EXISTS public.user_groups (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);


-- Table: group_permissions
CREATE TABLE IF NOT EXISTS public.group_permissions (
  group_id UUID NOT NULL,
  permission_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (group_id, permission_id)
);


-- Table: permissions
CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);


-- Table: sys_logs
CREATE TABLE IF NOT EXISTS public.sys_logs (
  id SERIAL,
  info TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);


-- Table: lists
CREATE TABLE IF NOT EXISTS public.lists (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  user_id UUID,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_lists_user_id ON public.lists(user_id);

-- Table: warmer_configs
CREATE TABLE IF NOT EXISTS public.warmer_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  instance_a_id TEXT NOT NULL,
  instance_b_id TEXT NOT NULL,
  phone_a TEXT,
  phone_b TEXT,
  status TEXT DEFAULT 'active'::text,
  base_daily_limit INTEGER DEFAULT 10,
  increment_per_day INTEGER DEFAULT 10,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  business_hours_start TIME DEFAULT '08:00:00'::time without time zone,
  business_hours_end TIME DEFAULT '20:00:00'::time without time zone,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  current_mode TEXT DEFAULT 'active'::text,
  mode_until TIMESTAMP WITH TIME ZONE,
  PRIMARY KEY (id)
);


-- Table: scheduled_jobs
CREATE TABLE IF NOT EXISTS public.scheduled_jobs (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  campaign_id UUID,
  status TEXT DEFAULT 'pending'::text,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  user_id UUID,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_scheduled_jobs_user_id ON public.scheduled_jobs(user_id);

-- Table: message_queue
CREATE TABLE IF NOT EXISTS public.message_queue (
  id SERIAL,
  campaign_id UUID NOT NULL,
  user_id UUID NOT NULL,
  contact_id TEXT,
  telefone TEXT NOT NULL,
  nome TEXT,
  mensagem TEXT NOT NULL,
  status TEXT DEFAULT 'pendente'::text,
  tentativas INTEGER DEFAULT 0,
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  data_envio TIMESTAMP WITH TIME ZONE,
  erro TEXT,
  processing_started_at TIMESTAMP WITH TIME ZONE,
  recovered_at TIMESTAMP WITH TIME ZONE,
  schedule_id INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_message_queue_user_id ON public.message_queue(user_id);

-- Table: warmer_logs
CREATE TABLE IF NOT EXISTS public.warmer_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  warmer_id UUID,
  from_phone TEXT NOT NULL,
  to_phone TEXT NOT NULL,
  message_type TEXT DEFAULT 'text'::text,
  content_summary TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);


-- Table: user_uploaded_files
CREATE TABLE IF NOT EXISTS public.user_uploaded_files (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  original_name TEXT NOT NULL,
  stored_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  extension TEXT NOT NULL,
  media_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  storage_path TEXT NOT NULL,
  public_token TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE,
  file_blob BYTEA,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_user_uploaded_files_user_id ON public.user_uploaded_files(user_id);

