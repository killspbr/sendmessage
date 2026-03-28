-- Migration: Módulo Maturador de Chips (WhatsApp Warming)
-- Execute este script no console de SQL da sua base (Supabase ou EasyPanel)

-- Tabela de Configurações das rotinas de maturação
CREATE TABLE IF NOT EXISTS warmer_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_a_id TEXT NOT NULL,
  instance_b_id TEXT NOT NULL,
  phone_a TEXT,
  phone_b TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'error')),
  base_daily_limit INTEGER DEFAULT 10,
  increment_per_day INTEGER DEFAULT 10,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  business_hours_start TIME DEFAULT '08:00:00',
  business_hours_end TIME DEFAULT '20:00:00',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Logs (histórico de envios de maturação)
CREATE TABLE IF NOT EXISTS warmer_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warmer_id UUID REFERENCES warmer_configs(id) ON DELETE CASCADE,
  from_phone TEXT NOT NULL,
  to_phone TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'emoji', 'audio', 'presence')),
  content_summary TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para melhorar consultas por dia/warmer
CREATE INDEX IF NOT EXISTS idx_warmer_configs_status ON warmer_configs(status);
CREATE INDEX IF NOT EXISTS idx_warmer_logs_warmer_id_sent_at ON warmer_logs(warmer_id, sent_at);
