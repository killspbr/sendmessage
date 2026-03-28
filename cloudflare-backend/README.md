# Cloudflare Backend Migration

Esta pasta cria a base do backend em Cloudflare Workers para o projeto `sendmessage`.

## O que esta base ja cobre

- Worker HTTP com [Hono](https://hono.dev/)
- Postgres via `pg` com suporte a Hyperdrive
- Upload e leitura publica de arquivos via R2
- Presenca de sessao e card de usuarios ativos
- CRUD basico do `Laboratorio de Instancias`

## O que ainda nao substitui o backend Node atual

Ainda faltam migrar estas partes:

- scheduler continuo de campanhas
- queue worker do WhatsApp
- envios manuais/agendados do Laboratorio
- rotas legadas grandes do `backend/src/index.js`

Essas partes precisam ser redesenhadas para componentes assíncronos da Cloudflare:

- Workflows
- Queues
- Cron Triggers

## Configuracao recomendada

1. Copiar `wrangler.toml.example` para `wrangler.toml`
2. Configurar:
   - binding `UPLOADS_BUCKET`
   - binding `HYPERDRIVE`
   - `JWT_SECRET`
3. Criar o bucket R2
4. Apontar o frontend para o Worker apenas depois de validar as rotas necessarias

## Comandos

```bash
npm install
npm run check
npm run dev
```

## Checklist de staging

1. Criar bucket R2 `sendmessage-uploads`
2. Criar Hyperdrive apontando para o Postgres atual
3. Ajustar [wrangler.toml](G:\Dev\sendmessage\cloudflare-backend\wrangler.toml):
   - `name`
   - `bucket_name`
   - `hyperdrive.id`
4. Criar secret:
   - `JWT_SECRET`
5. Opcionalmente criar `.dev.vars` local a partir de [.dev.vars.example](G:\Dev\sendmessage\cloudflare-backend\.dev.vars.example)
6. Rodar local:
   - `npm run check`
   - `npm run dev`
7. Validar:
   - `GET /api/health`
   - `GET /api/_migration-status`
8. Publicar staging:
   - `npm run deploy`

## Rotas prontas para validar em staging

- `GET /api/health`
- `GET /api/_migration-status`
- `POST /api/auth/presence`
- `POST /api/auth/presence/logout`
- `GET /api/admin/active-users`
- `GET /api/files`
- `POST /api/files/upload`
- `DELETE /api/files/:id`
- `GET /api/uploads/public/:token/:storedName`
- `GET /api/admin/warmer`
- `POST /api/admin/warmer`
- `PUT /api/admin/warmer/:id/status`
- `GET /api/admin/warmer/:id/logs`

## Observacao

Esta base foi criada para permitir uma migracao realista e segura. Ela nao remove o backend Node atual automaticamente, porque o motor de fila/agendamento ainda precisa ser portado para a arquitetura assíncrona da Cloudflare.
