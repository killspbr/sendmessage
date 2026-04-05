# Guia de Deploy - SendMessage

## Arquitetura Atual

- **Frontend:** Cloudflare Pages (conectado ao GitHub, deploy automatico via push ao `main`)
  - URL: `sendmessage-frontend.pages.dev`
- **Backend API:** Cloudflare Workers
  - URL: `https://sendmessage-backend.engclrodrigues.workers.dev`
- **Banco de Dados:** PostgreSQL via Cloudflare Hyperdrive
- **Uploads:** Cloudflare R2 (bucket: `sendmessage-uploads`)

## Deploy do Backend (Worker)

```bash
cd cloudflare-backend
npm install
npx wrangler deploy
```

### Secrets necessarios (Cloudflare Workers Dashboard)

- `JWT_SECRET` (minimo 32 caracteres)
- `GEMINI_API_KEY` (opcional)
- `WEBHOOK_SECRET` (header x-webhook-secret para Evolution API)
- `MIGRATION_SECRET` (para /api/rescue-migration)

### Variaveis de ambiente (wrangler.toml)

- `SYSTEM_TIMEZONE=America/Sao_Paulo`
- `SYSTEM_TIMEZONE_LABEL=GMT-3 (America/Sao_Paulo)`
- `ACTIVE_USER_WINDOW_SECONDS=120`
- `WARMER_CRON_ENABLED=false`

## Deploy do Frontend (Pages)

O deploy e automatico ao fazer push ao `main`. Alternativa manual:

```bash
cd frontend
npm install
npm run build
npx wrangler pages deploy dist --project-name sendmessage
```

## Checklist Pos-Deploy

- [ ] Login/logout funciona
- [ ] Sem erros de CORS no console
- [ ] CRUD de contatos/listas funciona
- [ ] Campanha envia corretamente
- [ ] Uploads funcionam com links publicos
- [ ] Chatbot IA responde (se GEMINI_API_KEY configurado)
- [ ] Warmer admin carrega
