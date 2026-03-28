-- Base schema for SendMessage on PostgreSQL
-- Timezone operacional do sistema: America/Sao_Paulo (GMT-3)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT,
    is_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS group_permissions (
    group_id UUID REFERENCES user_groups(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (group_id, permission_id)
);

CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    display_name TEXT,
    phone TEXT,
    group_id UUID REFERENCES user_groups(id) ON DELETE SET NULL,
    use_global_ai BOOLEAN DEFAULT true,
    ai_api_key TEXT,
    company_info TEXT,
    evolution_url TEXT,
    evolution_api_key TEXT,
    evolution_instance TEXT,
    webhook_whatsapp_url TEXT,
    webhook_email_url TEXT,
    daily_message_limit INTEGER,
    monthly_message_limit INTEGER,
    upload_quota_bytes BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contacts (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    list_id UUID REFERENCES lists(id) ON DELETE SET NULL,
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    status TEXT DEFAULT 'rascunho',
    channels TEXT[],
    list_name TEXT,
    message TEXT,
    delivery_payload JSONB,
    interval_min_seconds INTEGER DEFAULT 30,
    interval_max_seconds INTEGER DEFAULT 90,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS app_settings (
    id SERIAL PRIMARY KEY,
    global_ai_api_key TEXT,
    evolution_api_url TEXT,
    evolution_api_key TEXT,
    evolution_shared_instance TEXT,
    gemini_model TEXT DEFAULT 'gemini-2.5-flash',
    gemini_api_version TEXT DEFAULT 'v1',
    gemini_temperature NUMERIC(3,2) DEFAULT 0.7,
    gemini_max_tokens INTEGER DEFAULT 1024,
    default_daily_message_limit INTEGER DEFAULT 300,
    default_monthly_message_limit INTEGER DEFAULT 9000,
    default_upload_quota_bytes BIGINT DEFAULT 104857600,
    global_gemini_daily_limit INTEGER DEFAULT 5000,
    send_interval_min INTEGER DEFAULT 30,
    send_interval_max INTEGER DEFAULT 90,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS scheduled_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending',
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS campaign_schedule (
    id SERIAL PRIMARY KEY,
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    data_inicio DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    limite_diario INTEGER DEFAULT 300,
    intervalo_minimo INTEGER DEFAULT 30,
    intervalo_maximo INTEGER DEFAULT 90,
    mensagens_por_lote INTEGER DEFAULT 45,
    tempo_pausa_lote INTEGER DEFAULT 15,
    status TEXT DEFAULT 'agendado',
    scheduler_claimed_at TIMESTAMP WITH TIME ZONE,
    pause_reason TEXT,
    pause_details TEXT,
    paused_at TIMESTAMP WITH TIME ZONE,
    resumed_at TIMESTAMP WITH TIME ZONE,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS message_queue (
    id SERIAL PRIMARY KEY,
    schedule_id INTEGER REFERENCES campaign_schedule(id) ON DELETE CASCADE,
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    contact_id TEXT,
    telefone TEXT NOT NULL,
    nome TEXT,
    mensagem TEXT NOT NULL,
    status TEXT DEFAULT 'pendente',
    tentativas INTEGER DEFAULT 0,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    data_envio TIMESTAMP WITH TIME ZONE,
    processing_started_at TIMESTAMP WITH TIME ZONE,
    recovered_at TIMESTAMP WITH TIME ZONE,
    erro TEXT
);

CREATE TABLE IF NOT EXISTS gemini_api_keys (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    api_key TEXT NOT NULL,
    status TEXT DEFAULT 'ativa',
    ultimo_uso TIMESTAMP WITH TIME ZONE,
    requests_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS gemini_api_usage_logs (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    gemini_key_id INTEGER REFERENCES gemini_api_keys(id) ON DELETE SET NULL,
    source TEXT,
    module TEXT,
    request_count INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS scheduler_logs (
    id SERIAL PRIMARY KEY,
    schedule_id INTEGER REFERENCES campaign_schedule(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS whatsapp_reputation (
    id SERIAL PRIMARY KEY,
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    level TEXT DEFAULT 'unknown',
    score INTEGER DEFAULT 0,
    details JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contact_send_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
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
);

CREATE TABLE IF NOT EXISTS campaign_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
    status INTEGER,
    ok BOOLEAN DEFAULT false,
    total INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    run_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

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
    file_blob BYTEA,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_list_id ON contacts(list_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_jobs_status ON scheduled_jobs(status);
CREATE INDEX IF NOT EXISTS idx_history_user_id ON contact_send_history(user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_history_user_id ON campaign_history(user_id);
CREATE INDEX IF NOT EXISTS idx_mq_user_status ON message_queue(user_id, status);
CREATE INDEX IF NOT EXISTS idx_mq_schedule_status ON message_queue(schedule_id, status);
CREATE INDEX IF NOT EXISTS idx_user_uploaded_files_user_created_at ON user_uploaded_files(user_id, created_at DESC);
