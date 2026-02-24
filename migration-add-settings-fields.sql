-- Migration: mover configurações do localStorage para o servidor
-- Execute este script no console SQL do EasyPanel

-- Adicionar campos de IA e Evolution em user_profiles (configurações individuais)
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS ai_api_key TEXT,
  ADD COLUMN IF NOT EXISTS evolution_url TEXT,
  ADD COLUMN IF NOT EXISTS evolution_apikey TEXT,
  ADD COLUMN IF NOT EXISTS evolution_instance TEXT,
  ADD COLUMN IF NOT EXISTS company_info TEXT,
  ADD COLUMN IF NOT EXISTS gemini_model TEXT DEFAULT 'gemini-1.5-flash-latest',
  ADD COLUMN IF NOT EXISTS gemini_api_version TEXT DEFAULT 'v1',
  ADD COLUMN IF NOT EXISTS gemini_temperature NUMERIC(3,2) DEFAULT 0.7,
  ADD COLUMN IF NOT EXISTS gemini_max_tokens INTEGER DEFAULT 1024,
  ADD COLUMN IF NOT EXISTS send_interval_min INTEGER DEFAULT 30,
  ADD COLUMN IF NOT EXISTS send_interval_max INTEGER DEFAULT 90;

-- Adicionar campos de IA e Evolution em app_settings (configurações globais)
-- Primeiro, criar a tabela se não existir (com todos os campos)
CREATE TABLE IF NOT EXISTS app_settings (
  id SERIAL PRIMARY KEY,
  global_ai_api_key TEXT,
  global_webhook_email_url TEXT,
  evolution_api_url TEXT,
  evolution_api_key TEXT,
  evolution_shared_instance TEXT,
  gemini_model TEXT DEFAULT 'gemini-1.5-flash-latest',
  gemini_api_version TEXT DEFAULT 'v1',
  gemini_temperature NUMERIC(3,2) DEFAULT 0.7,
  gemini_max_tokens INTEGER DEFAULT 1024,
  send_interval_min INTEGER DEFAULT 30,
  send_interval_max INTEGER DEFAULT 90,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Se a tabela já existia, adicionar colunas que podem estar faltando
ALTER TABLE app_settings
  ADD COLUMN IF NOT EXISTS gemini_model TEXT DEFAULT 'gemini-1.5-flash-latest',
  ADD COLUMN IF NOT EXISTS gemini_api_version TEXT DEFAULT 'v1',
  ADD COLUMN IF NOT EXISTS gemini_temperature NUMERIC(3,2) DEFAULT 0.7,
  ADD COLUMN IF NOT EXISTS gemini_max_tokens INTEGER DEFAULT 1024,
  ADD COLUMN IF NOT EXISTS send_interval_min INTEGER DEFAULT 30,
  ADD COLUMN IF NOT EXISTS send_interval_max INTEGER DEFAULT 90;
