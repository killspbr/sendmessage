# SendMessage - Pacote de Continuidade para Outra IA (2026-04-01)

## 1) Fonte oficial para continuidade
Use estes artefatos como verdade do estado atual:

- Handoff técnico detalhado: [AI_HANDOFF_2026-03-29.md](/G:/Dev/sendmessage/docs/AI_HANDOFF_2026-03-29.md)
- Inventário de rotas (declarada x final): [ROUTE_INVENTORY_2026-04-01.md](/G:/Dev/sendmessage/docs/ROUTE_INVENTORY_2026-04-01.md)
- Este pacote consolidado: [AI_CONTINUITY_PACKAGE_2026-04-01.md](/G:/Dev/sendmessage/docs/AI_CONTINUITY_PACKAGE_2026-04-01.md)

---

## 2) Snapshot atual do repositório
- Workspace: `G:\Dev\sendmessage`
- Branch: `main`
- Commits mais recentes:
  - `fea4b80` Fix route prefix issue, typecheck error, and publish route inventory
  - `976d39a` Audit Cloudflare routes and fix duplicated /api prefix in status route
  - `3d6a1e5` chore(release): update extension zips to v1.1.4 and sync metadata
  - `9f1a42c` chore(release): bump frontend and extension metadata to v1.1.4
  - `1bc29fc` fix(db): enforce public schema prefix across all queries and ddls for hyperdrive stability

---

## 3) Arquitetura vigente (produção)
- Frontend: `https://sendmessage-frontend.pages.dev`
- Backend principal: `https://sendmessage-backend.claudio-rodrigues-seconci.workers.dev`
- Runtime backend: Cloudflare Worker + Hono + TypeScript
- Banco: PostgreSQL externo via Hyperdrive
- Uploads: R2 (`sendmessage-uploads`)

---

## 4) Correções críticas já aplicadas
1. Estabilização de respostas para evitar cascata CORS mascarando 500.
2. Redução de gargalos em queries administrativas/scheduler.
3. Tratamento de sessão/permissões no frontend para evitar “Acesso Negado” transitório.
4. Correção de rota duplicada:
  - `status.evo-test` corrigida para final em `/api/status/evo-test`.
5. Auditoria de rotas publicada e validada (sem prefixo `/api` duplicado no inventário atual).

---

## 5) Arquivos-chave alterados recentemente
- [cloudflare-backend/src/index.ts](/G:/Dev/sendmessage/cloudflare-backend/src/index.ts)
- [cloudflare-backend/src/lib/db.ts](/G:/Dev/sendmessage/cloudflare-backend/src/lib/db.ts)
- [cloudflare-backend/src/lib/ddl.ts](/G:/Dev/sendmessage/cloudflare-backend/src/lib/ddl.ts)
- [cloudflare-backend/src/routes/status.ts](/G:/Dev/sendmessage/cloudflare-backend/src/routes/status.ts)
- [cloudflare-backend/src/routes/schedules.ts](/G:/Dev/sendmessage/cloudflare-backend/src/routes/schedules.ts)
- [cloudflare-backend/src/routes/adminOps.ts](/G:/Dev/sendmessage/cloudflare-backend/src/routes/adminOps.ts)
- [cloudflare-backend/src/routes/adminUsers.ts](/G:/Dev/sendmessage/cloudflare-backend/src/routes/adminUsers.ts)
- [cloudflare-backend/src/routes/profileSettings.ts](/G:/Dev/sendmessage/cloudflare-backend/src/routes/profileSettings.ts)
- [frontend/src/api.ts](/G:/Dev/sendmessage/frontend/src/api.ts)
- [frontend/src/hooks/useAuth.ts](/G:/Dev/sendmessage/frontend/src/hooks/useAuth.ts)
- [frontend/src/hooks/usePermissions.ts](/G:/Dev/sendmessage/frontend/src/hooks/usePermissions.ts)

---

## 6) Checklist de validação rápida para próxima IA
1. Rodar typecheck backend:
```bash
cd G:/Dev/sendmessage/cloudflare-backend
npm run check
```

2. Rodar build frontend:
```bash
cd G:/Dev/sendmessage/frontend
npm run build
```

3. Validar rotas críticas com token:
- `/api/auth/me`
- `/api/profile`
- `/api/lists`
- `/api/history`
- `/api/schedules/professional`
- `/api/queue/professional`
- `/api/admin/users`
- `/api/admin/queue`
- `/api/status/evo-test`

4. Validar preflight CORS:
- `OPTIONS /api/auth/login`
- `OPTIONS /api/lists`

5. Validar fluxo de login no browser:
- sem loop de “Carregando Autenticação”
- sem “Acesso Negado” transitório indevido

---

## 7) Riscos e pendências abertas
1. DDL em runtime: estratégia atual exige migrações formais para novas mudanças de schema.
2. Observabilidade: faltam logs estruturados por request-id e painel de diagnóstico consolidado.
3. Payload de histórico pode ser pesado; ideal paginar por padrão.
4. Revisar logging de body de requisições para não expor dados sensíveis em produção.

---

## 8) Prompt pronto para outra IA (copiar e colar)
```txt
Você está assumindo o projeto SendMessage no workspace G:\Dev\sendmessage.
Leia primeiro:
1) docs/AI_HANDOFF_2026-03-29.md
2) docs/ROUTE_INVENTORY_2026-04-01.md
3) docs/AI_CONTINUITY_PACKAGE_2026-04-01.md

Objetivo inicial:
- Confirmar integridade pós-handoff (backend cloudflare + frontend).
- Validar todas as rotas críticas e CORS.
- Reportar divergências entre código e docs.

Entregue:
1) Status PASS/FAIL por endpoint crítico.
2) Causa raiz de cada falha.
3) Patch mínimo por falha.
4) Evidência de validação após correção.
5) Lista de riscos residuais.
```

---

## 9) Referência de operação
### Deploy backend Cloudflare
```bash
cd G:/Dev/sendmessage/cloudflare-backend
npm run deploy
```

### Tail de logs
```bash
cd G:/Dev/sendmessage/cloudflare-backend
npx wrangler tail sendmessage-backend
```

