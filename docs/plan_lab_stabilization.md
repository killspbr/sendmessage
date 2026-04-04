# Plano de Estabilização e Melhoria do Laboratório (Instance Lab)

Este plano visa resolver o erro de permissão detectado no banco de dados (`permission denied for schema public`) e finalizar as melhorias premium do módulo de maturação.

## 1. Fase de Diagnóstico e Estabilização do DB
- **Agente:** `database-architect` + `backend-specialist`
- **Problema:** O usuário do Hyperdrive não tem permissão `USAGE` ou `CREATE` no schema `public`.
- **Ações:**
    - Ajustar o código de inicialização do schema no backend para lidar com permissões negadas.
    - Garantir que todas as queries usem explicitamente `public.` como prefixo (padrão de segurança do projeto).
    - Propor os comandos SQL `GRANT` necessários para o administrador executar no banco de dados principal.

## 2. Fase de Implementação do Laboratório "Pro Max"
- **Agente:** `backend-specialist`
- **Ações:**
    - Finalizar a integração das **AI Personas** no prompt do Gemini.
    - Validar a lógica de **Modo Noturno** para garantir que pule execuções nos horários configurados.
    - Adicionar logs de erro detalhados quando uma instância for desconectada.

## 3. Fase de UI/UX Premium (Dashboard)
- **Agente:** `frontend-specialist`
- **Ações:**
    - Implementar o **Live Chat Monitor** dentro dos cards de cada par.
    - Adicionar indicadores visuais de "Saúde do Número" e "Modo Repouso".
    - Tornar o dashboard responsivo para monitoramento móvel.

## 4. Fase de Verificação e Testes
- **Agente:** `test-engineer`
- **Ações:**
    - Executar `security_scan.py` para garantir que as chaves da Evolution/Gemini estão protegidas.
    - Validar o fluxo de ponta a ponta: Criar Par -> Ativar Modo Noturno -> Simular Janela de Chat.

---
**Critérios de Aceitação:**
- Erro "permission denied" removido.
- Logs do Laboratório aparecendo na interface.
- Interface seguindo o design premium definido.
