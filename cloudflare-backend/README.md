# Cloudflare Backend Migration

Este projeto contem o backend `sendmessage` rodando em Cloudflare Workers (Hono + Postgres via Hyperdrive + R2).

## Cobertura atual

- Auth completo (`signup`, `login`, `forgot`, `reset`, `me`)
- Perfil/configuracoes (`/api/profile*`, `/api/settings`)
- Presenca de sessao e card admin de usuarios online
- CRUD de listas, contatos e campanhas
- Disparo direto de campanha (WhatsApp via Evolution)
- Agendamento profissional com fila e historico
- Rotas de IA (proxy Gemini + extracao)
- Gestao admin de Gemini e metricas operacionais
- Gestao admin de usuarios, grupos e permissoes
- Notificacao administrativa para usuario via Evolution
- Laboratorio de instancias (CRUD + force/manual + logs)
- Upload de arquivos em R2 com links publicos
- Extracao Google Maps (`search`, `next-page`, `details`)
- Compatibilidade de webhook de e-mail (`/api/n8n/trigger`)

## Configuracao recomendada

1. Copiar `wrangler.toml.example` para `wrangler.toml`
2. Configurar bindings:
   - `UPLOADS_BUCKET`
   - `HYPERDRIVE` (ou `DATABASE_URL`)
3. Configurar variaveis:
   - `JWT_SECRET` (obrigatoria)
   - `SYSTEM_TIMEZONE` (recomendado: `America/Sao_Paulo`)
   - `SYSTEM_TIMEZONE_LABEL` (recomendado: `GMT-3 (America/Sao_Paulo)`)
   - `ACTIVE_USER_WINDOW_SECONDS` (opcional, default 120)
   - `GOOGLE_MAPS_API_KEY` (opcional, fallback para extracao)
   - `WEBHOOK_EMAIL` (opcional, fallback para `/api/n8n/trigger`)
   - `GEMINI_API_KEY` (opcional, fallback para IA)

## Comandos

```bash
npm install
npm run check
npm run dev
npm run deploy
```

## Checklist rapido de staging

1. `npm run check`
2. Subir `wrangler dev` e validar:
   - `GET /api/health`
   - `GET /api/profile/full` (autenticado)
   - `GET /api/schedules/professional` (autenticado)
   - `GET /api/admin/users` (admin)
   - `GET /api/admin/warmer` (admin)
3. Configurar frontend para apontar `VITE_API_URL` para a URL do Worker
4. Publicar com `npm run deploy`
