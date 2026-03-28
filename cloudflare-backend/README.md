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

## Observacao

Esta base foi criada para permitir uma migracao realista e segura. Ela nao remove o backend Node atual automaticamente, porque o motor de fila/agendamento ainda precisa ser portado para a arquitetura assíncrona da Cloudflare.
