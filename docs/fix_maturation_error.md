# Plano de Correção Definitiva: Maturador de Chip (Laboratório)

Este plano visa resolver o erro crítico `permission denied for schema public` e as falhas de CORS exibidas no console do navegador, garantindo que o laboratório de maturação opere de forma estável.

## 🎯 Objetivos
1. Restaurar permissões de acesso ao esquema `public` no PostgreSQL/Hyperdrive.
2. Corrigir o middleware de erro do backend para garantir que headers CORS sejam enviados mesmo em falhas fatais.
3. Auditar todas as queries da rota `/api/warmer` para garantir o uso correto de prefixos.
4. Validar a estabilidade da conexão Hyperdrive sob carga.

---

## 🛠️ Fases do Plano

### Fase 1: Auditoria de Banco de Dados (Database Architect)
- **Ação:** Verificar o estado das tabelas de maturação (`warmer_instances`, `warmer_logs`).
- **Correção:** Implementar comando de `GRANT` explícito se necessário ou ajustar queries que tentam acessar metadados restritos do Postgres.
- **Documentação:** Garantir que o `wrangler.toml` use a string de conexão correta com o papel (role) habilitado para o esquema public.

### Fase 2: Resiliência do Backend (Backend Specialist)
- **Ação:** Atualizar o `cloudflare-backend/src/index.ts` e o middleware de CORS.
- **Correção:** Garantir que o `error()` handler capture exceções de banco e responda com headers CORS adequados antes de fechar a conexão.
- **Estabilização:** Mover a lógica de detecção de permissão de esquema para um utilitário de saúde central.

### Fase 3: Depuração e Logs (Debugger)
- **Ação:** Analisar as saídas do `wrangler tail` (disponível no ambiente do usuário).
- **Análise:** Identificar se o erro ocorre no `fetch` inicial ou em commits de transação.
- **Verificação:** Testar endpoints individualmente via terminal para confirmar a volta da comunicação.

### Fase 4: Validação Frontend (Frontend Specialist)
- **Ação:** Ajustar o tratamento de erro visual no `Laboratório`.
- **Melhoria:** Exibir mensagens de erro mais amigáveis e logs de depuração se `DEBUG_MODE` estiver ativo.
- **Teste Final:** Realizar o ciclo completo de "Novo Par de Maturação" para garantir persistência.

---

## 🚦 Critérios de Sucesso
- [ ] Sumiço do banner vermelho `permission denied for schema public`.
- [ ] Fim dos erros de CORS no console.
- [ ] Persistência de novos pares de maturação no banco de dados.
- [ ] Status 200 nas rotas `/api/warmer/*`.

---

## 📅 Próximos Passos
1. **Executar Auditoria SQL** via query tool.
2. **Aplicar Patch no Middleware CORS**.
3. **Re-implantação (Deploy)** e monitoramento de logs.
