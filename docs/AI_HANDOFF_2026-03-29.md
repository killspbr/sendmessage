# SendMessage - Handoff Técnico Completo (2026-03-29)

## 1) Objetivo deste handoff
Este documento consolida o estado atual do projeto para continuidade por outra IA/equipe, com foco em:
- migração backend para Cloudflare Workers;
- estabilização de autenticação e CORS;
- redução de erros 500 em rotas administrativas/agendamentos;
- comportamento de "Acesso Negado" temporário após login.

---

## 2) Estado atual do repositório
- Branch: `main`
- Status local antes deste handoff: havia alterações não commitadas em backend/frontend Cloudflare.
- Este handoff foi salvo no repositório em arquivo versionado.

Pastas principais:
- Backend legado (Node/Express): [backend](/G:/Dev/sendmessage/backend)
- Backend Cloudflare (ativo): [cloudflare-backend](/G:/Dev/sendmessage/cloudflare-backend)
- Frontend (React/Vite): [frontend](/G:/Dev/sendmessage/frontend)
- Extensão: [extension](/G:/Dev/sendmessage/extension)
- Documentação: [docs](/G:/Dev/sendmessage/docs)

---

## 3) Decisão arquitetural vigente
Backend de produção está sendo servido via Cloudflare Worker:
- URL: `https://sendmessage-backend.claudio-rodrigues-seconci.workers.dev`
- Binding de banco: Hyperdrive `12abb41244884c95a5ab078a0f17c62f`
- Bucket uploads: `sendmessage-uploads`

Observação: o backend Node legado não é o alvo principal atual.

---

## 4) Histórico recente (commits relevantes)
Commits recentes (mais novos primeiro):
- `602ea5e` Harden Cloudflare API routes and fix scheduler/admin 500s
- `d503308` Fix intermittent worker 1101 and add auth login retry
- `dcfc000` Stabilize lists load and avoid logout on 403 responses
- `ee30533` Harden Cloudflare auth flows and legacy warmer schema compatibility
- `921a218` Prevent auth loading deadlock with request timeout and hard stop
- `afa7379` Reduce startup request burst and harden DB timeout handling
- `fb0a7e1` Add top-level error guard to always return CORS-enabled JSON
- `07784bb` Open CORS globally on Cloudflare worker for diagnostics
- `af1a3dd` Load global settings only after authenticated user is present
- `b83e904` Add explicit login error handling and route-level CORS headers

---

## 5) Problemas reportados pelo usuário (último ciclo)
1. `500` em múltiplas rotas (`/api/profile`, `/api/lists`, `/api/history`, `/api/auth/login`).
2. Em alguns casos, browser reportava CORS (sem `Access-Control-Allow-Origin`), causado por falha 500 antes do fluxo padrão.
3. Após login, UI ficava com "Acesso Negado" por ~1 minuto e depois liberava.
4. Timeouts no heartbeat/presença.

---

## 6) Correções aplicadas neste ciclo

### 6.1 Backend Cloudflare - robustez DB
Arquivo: [db.ts](/G:/Dev/sendmessage/cloudflare-backend/src/lib/db.ts)

Mudanças:
- pool reduzido (`max: 5`);
- timeout conexão (`connectionTimeoutMillis: 15000`);
- timeout por query com wrapper:
  - leitura: 12s;
  - escrita: 15s;
- retry de queries somente leitura;
- critérios retryáveis expandidos (`ETIMEDOUT`, `ECONNRESET`, `ECONNREFUSED`, `EPIPE`, `DB_QUERY_TIMEOUT`, mensagens de conexão encerrada/slots).

### 6.2 Backend Cloudflare - desativação de DDL em runtime
Arquivo: [ddl.ts](/G:/Dev/sendmessage/cloudflare-backend/src/lib/ddl.ts)

Mudança:
- flag `ENABLE_RUNTIME_DDL = false` (retorno imediato em `runBestEffortDdl`).

Motivo:
- DDL runtime em Worker (principalmente sob concorrência) aumentava latência e estourava timeout.

### 6.3 Backend Cloudflare - otimização de queries pesadas
Arquivo: [adminOps.ts](/G:/Dev/sendmessage/cloudflare-backend/src/routes/adminOps.ts)
- `/api/admin/queue`: removido `SELECT q.*` e retorno só de colunas necessárias.
- ordenação por `q.id DESC` (mais eficiente).

Arquivo: [schedules.ts](/G:/Dev/sendmessage/cloudflare-backend/src/routes/schedules.ts)
- `listSchedulesWithStats`: substituição de múltiplos subselects correlacionados por agregação única (`LEFT JOIN` em subquery agrupada de `message_queue`).
- removida dependência de parse JSON regex em `scheduler_logs` para cada linha (campos `last_event`/`last_event_at` retornam `NULL` provisoriamente).
- `/api/queue/professional`: removido subselect JSON por item e retorno simplificado.

### 6.4 Frontend - sessão/permissões resilientes
Arquivo: [useAuth.ts](/G:/Dev/sendmessage/frontend/src/hooks/useAuth.ts)
- em falha transitória no `/api/auth/me`, mantém sessão do cache local em vez de forçar logout imediato.

Arquivo: [usePermissions.ts](/G:/Dev/sendmessage/frontend/src/hooks/usePermissions.ts)
- refatorado:
  - retry progressivo no carregamento de permissões;
  - cache local (`auth_permissions_cache`);
  - em falha transitória, reaproveita permissões anteriores para evitar "Acesso Negado" falso.

Arquivo: [api.ts](/G:/Dev/sendmessage/frontend/src/api.ts)
- já contém limitador de concorrência de requisições (`MAX_CONCURRENT_API_REQUESTS = 4`) e timeouts/retry por endpoint.

---

## 7) Deploy e validação executados

### 7.1 Build/check local
- `cloudflare-backend`: `npm run check` -> OK
- `frontend`: `npm run build` -> OK

### 7.2 Deploy Worker
Comando:
- `npm run deploy` em [cloudflare-backend](/G:/Dev/sendmessage/cloudflare-backend)

Resultado:
- deploy concluído com sucesso;
- Current Version ID: `9ead9371-8375-4c09-bcb7-424712d1fd42`.

### 7.3 Testes HTTP após deploy
Com token válido do usuário admin, endpoints retornaram `200`:
- `/api/profile`
- `/api/lists`
- `/api/history`
- `/api/queue/professional`
- `/api/schedules/history?status=all`
- `/api/admin/queue`
- `/api/admin/users`
- `/api/admin/groups`
- `/api/admin/group-permissions`
- `/api/admin/permissions`
- `/api/admin/operational-stats`
- `/api/admin/gemini-keys`

CORS preflight (`OPTIONS`) validado com `204` em rotas como `/api/auth/login` e `/api/lists`.

---

## 8) Itens ainda sensíveis / atenção
1. **Runtime DDL desligado**:
   - necessário manter migrações SQL formais para alterações de schema.
2. **Campos `last_event`/`last_event_at` em agendamentos**:
   - estão como `NULL` após otimização de query;
   - se a UI depender desses campos, reintroduzir via estratégia materializada/índice auxiliar.
3. **Latência sob picos extremos**:
   - melhorou bastante, mas monitorar `REQUEST_TIMEOUT` em burst muito alto.
4. **Login 500 intermitente reportado historicamente**:
   - no teste deste ciclo o endpoint respondeu com JSON e CORS correto;
   - em caso de regressão, usar tail em produção (ver seção 11).

---

## 9) Requisitos funcionais recentes implementados (resumo)
- recuperação de senha sem SMTP (envio por WhatsApp via Evolution API) em:
  - [auth.ts](/G:/Dev/sendmessage/cloudflare-backend/src/routes/auth.ts) (`/api/auth/forgot-password`);
- fluxo de agendamentos profissional com timezone `America/Sao_Paulo` (GMT-3) no backend Cloudflare;
- módulo admin/monitoramento e APIs Gemini (com consultas administrativas em backend Cloudflare);
- melhorias de estabilidade no carregamento de sessão/permissões no frontend.

---

## 10) Próximos passos recomendados (para próxima IA)
1. Validar no browser, com usuário real:
   - login;
   - carregamento Dashboard/Contatos/Campanhas;
   - telas admin (Users & Groups, APIs Gemini, Segurança, Agendamentos).
2. Adicionar observabilidade mínima:
   - request id por resposta;
   - logs estruturados por rota crítica.
3. Criar migrações SQL consolidadas para tudo que dependia de DDL runtime.
4. Reavaliar limite de concorrência no frontend (4) e ajustar se necessário.
5. Opcional: reduzir payload de `/api/history` por paginação padrão.

---

## 11) Comandos úteis para diagnóstico

### Worker
No diretório [cloudflare-backend](/G:/Dev/sendmessage/cloudflare-backend):
```bash
npm run check
npm run deploy
npx wrangler tail sendmessage-backend
```

### Smoke tests HTTP (Windows/PowerShell)
```powershell
$u='https://sendmessage-backend.claudio-rodrigues-seconci.workers.dev'
$t='Bearer <TOKEN>'
curl.exe -s -D - "$u/api/profile" -H "Authorization: $t" -H "Origin: https://sendmessage-frontend.pages.dev"
curl.exe -s -D - "$u/api/lists" -H "Authorization: $t" -H "Origin: https://sendmessage-frontend.pages.dev"
curl.exe -s -D - "$u/api/admin/users" -H "Authorization: $t" -H "Origin: https://sendmessage-frontend.pages.dev"
```

### Frontend
No diretório [frontend](/G:/Dev/sendmessage/frontend):
```bash
npm run build
```

---

## 12) Arquivos alterados neste ciclo (importantes)
- [db.ts](/G:/Dev/sendmessage/cloudflare-backend/src/lib/db.ts)
- [ddl.ts](/G:/Dev/sendmessage/cloudflare-backend/src/lib/ddl.ts)
- [adminOps.ts](/G:/Dev/sendmessage/cloudflare-backend/src/routes/adminOps.ts)
- [profileSettings.ts](/G:/Dev/sendmessage/cloudflare-backend/src/routes/profileSettings.ts)
- [schedules.ts](/G:/Dev/sendmessage/cloudflare-backend/src/routes/schedules.ts)
- [api.ts](/G:/Dev/sendmessage/frontend/src/api.ts)
- [useAuth.ts](/G:/Dev/sendmessage/frontend/src/hooks/useAuth.ts)
- [usePermissions.ts](/G:/Dev/sendmessage/frontend/src/hooks/usePermissions.ts)

---

## 13) Observações finais
- O erro de CORS no browser era efeito colateral de erro 500 sem resposta útil; após estabilização de backend, os preflights/respostas estão voltando com headers válidos.
- Se houver nova ocorrência, coletar:
  - rota exata;
  - horário;
  - status;
  - trecho do `wrangler tail`.

