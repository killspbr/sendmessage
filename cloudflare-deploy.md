# Cloudflare Deploy (Frontend + Backend)

Documento operacional para publicar o projeto completo no Cloudflare em **29/03/2026**.

## Arquitetura atual

- Frontend: Cloudflare Pages (`frontend`)
- Backend API: Cloudflare Workers (`cloudflare-backend`)
- Banco: Postgres via Hyperdrive (`HYPERDRIVE`)
- Uploads: R2 (`UPLOADS_BUCKET`)

## 1) Deploy do Backend (Worker)

### 1.1 Pré-requisitos

No diretório [cloudflare-backend](G:\Dev\sendmessage\cloudflare-backend):

```bash
npm install
npm run check
npx wrangler deploy --dry-run
```

### 1.2 Configurar `wrangler.toml`

Arquivo: [wrangler.toml](G:\Dev\sendmessage\cloudflare-backend\wrangler.toml)

- `name = "sendmessage-backend"` (ou nome desejado)
- `[[hyperdrive]].id` com o ID real do Hyperdrive
- `[[r2_buckets]].bucket_name` com o bucket real de uploads

### 1.3 Secrets obrigatórios

Executar no diretório `cloudflare-backend`:

```bash
npx wrangler secret put JWT_SECRET
```

Opcional (fallback de IA):

```bash
npx wrangler secret put GEMINI_API_KEY
```

### 1.4 Variáveis de ambiente recomendadas

No `wrangler.toml` (`[vars]`) ou no dashboard:

- `SYSTEM_TIMEZONE=America/Sao_Paulo`
- `SYSTEM_TIMEZONE_LABEL=GMT-3 (America/Sao_Paulo)`
- `ACTIVE_USER_WINDOW_SECONDS=120`
- `GOOGLE_MAPS_API_KEY` (opcional, para extração)
- `WEBHOOK_EMAIL` (opcional, fallback de `/api/n8n/trigger`)

### 1.5 Publicar

```bash
npm run deploy
```

### 1.6 Smoke test do backend

Após deploy, validar:

- `GET /api/health`
- `GET /api/_migration-status`
- login e `GET /api/auth/me`
- `GET /api/profile/full`
- `GET /api/admin/users` (admin)
- `GET /api/admin/warmer` (admin)
- `GET /api/schedules/professional`
- `POST /api/campaigns/:id/send` (cenário controlado)

---

## 2) Deploy do Frontend (Pages)

### 2.1 Configuração da aplicação no Pages

- Framework preset: `Vite`
- Root directory: `frontend`
- Build command: `npm run build`
- Output directory: `dist`

### 2.2 Variáveis de ambiente do Frontend

No projeto Pages (Production/Preview):

- `VITE_API_URL=https://<worker-name>.<account-subdomain>.workers.dev`

### 2.3 Publicar

Conectar branch `main` no Pages e disparar deploy.

---

## 3) Checklist pós-publicação

1. Login/logout funcionando.
2. Dashboard sem erro de CORS.
3. Contatos/listas CRUD.
4. Campanhas (salvar + disparo manual).
5. Agendamento profissional (`/api/schedules/professional` e refresh).
6. Upload/remoção de arquivos e link público.
7. IA (proxy Gemini) e tela Admin Gemini.
8. Usuários & Grupos (alterar grupo/permissões, reset senha, notificação).
9. Laboratório de instâncias (CRUD + force/manual + logs).

---

## 4) Observações

- O backend Cloudflare já cobre os endpoints estáticos usados pelo frontend (`missing: []` na verificação local).
- Se `JWT_SECRET` não estiver configurado no Worker, auth não funcionará.
- Se `HYPERDRIVE`/R2 estiverem incorretos, as rotas podem responder com 500 mesmo com deploy bem-sucedido.
