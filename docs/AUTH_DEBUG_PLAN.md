# Plano de Depuração de Autenticação (Auth Debug)

Este documento descreve o plano de orquestração para resolver o erro HTTP 400 (Bad Request) na rota de login, possivelmente mascarando um erro 500 interno.

## 📋 Objetivos
- Identificar a causa real do erro 400.
- Validar se o `JWT_SECRET` está correto (> 32 caracteres).
- Auditar a tabela `users` para garantir hashes compatíveis (`sha256` vs `bcrypt`).
- Testar o fluxo completo de registro e login.

## 🛠️ Agentes Envolvidos
- **Explorer-Agent**: Mapeamento de segredos e código de hash.
- **Debugger**: Monitoramento de logs em tempo real (`wrangler tail`).
- **Backend-Specialist**: Auditoria de banco de dados e lógica SQL.
- **Test-Engineer**: Execução de testes de integração via `curl`.

## 🚀 Etapas

### Fase 1: Identificação (Monitoramento)
- [x] Iniciar `npx wrangler tail` em background.
- [ ] Executar requisição de login falha via `curl`.
- [ ] Capturar campo `technical` dos logs.

### Fase 2: Auditoria de Configuração
- [ ] Rodar `npx wrangler secret list`.
- [ ] Verificar tamanho do `JWT_SECRET`.
- [ ] Analisar `src/lib/password.ts` para conformidade com `sha256`.

### Fase 3: Auditoria de Dados
- [ ] Executar query SQL para verificar `password_hash` e `LENGTH` na tabela `users`.
- [ ] Confirmar se o usuário existe com o e-mail informado.

### Fase 4: Correção e Validação
- [ ] Aplicar correções de código se necessário.
- [ ] Atualizar segredos se necessário.
- [ ] Testar `/api/auth/signup` seguido de `/api/auth/login`.

## ✅ Critérios de Aceite
- Login retornando `200 OK` com payload contendo `token` e `user`.
- Sem erros de CORS ou cabeçalhos ausentes.
