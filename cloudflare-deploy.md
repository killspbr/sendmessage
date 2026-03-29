# Cloudflare Deploy (Frontend + Backend)

Operational guide to publish the full project on Cloudflare.

## Current architecture

- Frontend: Cloudflare Pages (`frontend`)
- Backend API: Cloudflare Workers (`cloudflare-backend`)
- Database: Postgres via Hyperdrive (`HYPERDRIVE`)
- Uploads: R2 (`UPLOADS_BUCKET`)

## 1) Backend deploy (Worker)

### 1.1 Preconditions

In [cloudflare-backend](G:\Dev\sendmessage\cloudflare-backend):

```bash
npm install
npm run check
npx wrangler deploy --dry-run
```

### 1.2 Configure `wrangler.toml`

File: [wrangler.toml](G:\Dev\sendmessage\cloudflare-backend\wrangler.toml)

- `name = "sendmessage-backend"` (or your preferred worker name)
- `[[hyperdrive]].id` must contain the real Hyperdrive ID
- `[[r2_buckets]].bucket_name` must contain the real uploads bucket

Current expected values:

- Worker URL: `https://sendmessage-backend.claudio-rodrigues-seconci.workers.dev`
- Hyperdrive ID: `12abb41244884c95a5ab078a0f17c62f`

### 1.3 Required secrets

Run in `cloudflare-backend`:

```bash
npx wrangler secret put JWT_SECRET
```

Optional:

```bash
npx wrangler secret put GEMINI_API_KEY
```

### 1.4 Recommended environment vars

In `wrangler.toml` (`[vars]`) or dashboard:

- `SYSTEM_TIMEZONE=America/Sao_Paulo`
- `SYSTEM_TIMEZONE_LABEL=GMT-3 (America/Sao_Paulo)`
- `ACTIVE_USER_WINDOW_SECONDS=120`
- `GOOGLE_MAPS_API_KEY` (optional)
- `WEBHOOK_EMAIL` (optional)

### 1.5 Publish

```bash
npm run deploy
```

### 1.6 Backend smoke tests

After deploy, validate:

- `GET /api/health`
- `GET /api/_migration-status`
- Login and `GET /api/auth/me`
- `GET /api/profile/full`
- `GET /api/admin/users` (admin)
- `GET /api/admin/warmer` (admin)
- `GET /api/schedules/professional`
- `POST /api/campaigns/:id/send` (controlled scenario)

## 2) Frontend deploy (Pages)

### 2.1 Pages configuration

- Framework preset: `Vite`
- Root directory: `frontend`
- Build command: `npm run build`
- Output directory: `dist`

### 2.2 Frontend env vars

In Pages (Production/Preview):

- `VITE_API_URL=https://sendmessage-backend.claudio-rodrigues-seconci.workers.dev`

### 2.3 Publish

Connect `main` branch and run deploy.

## 3) Hyperdrive troubleshooting

If Cloudflare dashboard shows `Invalid database credentials`:

1. Use a dedicated Postgres role for Hyperdrive (recommended: `cf_hyperdrive`).
2. Confirm SSL is enabled in Postgres (`SHOW ssl;` must return `on`).
3. Build the connection string with URL-encoded credentials.
4. Test credentials in VPS before saving them in dashboard.

Generate connection string:

```bash
npm run hyperdrive:conn -- --user cf_hyperdrive --password CfHyper2026Safe --host easypanel.soepinaobasta.com --port 5433 --database sendmessage
```

VPS credential test:

```bash
CID=$(docker ps --filter name=clrodrigues_postgres --format '{{.ID}}' | head -n 1)
docker exec -it "$CID" sh -lc 'psql -h 127.0.0.1 -p 5432 -U cf_hyperdrive -d sendmessage -c "select now();"'
```

## 4) Post deploy checklist

1. Login/logout works.
2. Dashboard has no CORS errors.
3. Contacts/lists CRUD works.
4. Campaign save + manual send works.
5. Professional schedule loads and refreshes.
6. Upload/delete files works with public links.
7. Gemini proxy and admin Gemini screen work.
8. Users & Groups admin actions work.
9. Warmer admin module loads and can force-run safely.

## 5) Windows CLI note

In `cmd.exe`, do not break `wrangler` commands with `\`.
Use a single line command.
