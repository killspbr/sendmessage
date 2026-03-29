# Plano: Evolução do Laboratório de Maturação (Anti-Ban & UX)

## Objetivo
Transformar o Instance Lab em uma ferramenta de maturação de elite, simulando comportamento humano real para evitar banimentos no WhatsApp, com foco em estabilidade e uma interface premium de alta performance.

## Tarefas

### Fase 0: Estabilização de Arquivos e Campanhas (URGENTE)
- [ ] **Correção de /api/files (500)**: Investigar e corrigir a listagem de arquivos do R2. -> *Verificar: Listagem de mídias carregando no perfil.*
- [ ] **Correção de /api/files/upload (400)**: Ajustar o parsing de multipart/form-data no Cloudflare Workers para uploads de mídia. -> *Verificar: Upload concluído com sucesso.*
- [ ] **Estabilização de /api/campaigns (500)**: Corrigir erro interno ao salvar/atualizar campanhas no banco de dados. -> *Verificar: Persistência de campanhas funcionando.*
- [ ] **Correção de /api/admin/warmer/force (400)**: Resolver erro de requisição inválida no acionamento manual do maturador. -> *Verificar: Botão "Forçar" funcionando sem erro 400.*

### Fase 1: Maturação de Elite (Anti-Ban)
- [ ] **Intervalos Variáveis**: Implementar atrasos aleatórios entre mensagens (ex: 30s a 5min) e simulação de digitação no `warmerService.js`. -> *Verificar: Logs mostrando delays inconsistentes.*
- [ ] **Troca Multimídia**: Adicionar suporte para envio de imagens e áudios curtos (armazenados no R2) entre instâncias. -> *Verificar: Mensagens de mídia entregues no WhatsApp.*
- [ ] **Simulação de Leitura**: Configurar webhooks para marcar mensagens como lidas automaticamente pelas instâncias de maturação. -> *Verificar: Status "Visualizado" nas conversas.*

### Fase 2: Estabilidade e Resiliência
- [ ] **Tratamento de Erros Estruturado**: Migrar logs de console para uma tabela de `system_logs` no Postgres para auditoria remota. -> *Verificar: Consultar logs via dashboard.*
- [ ] **Retry Dinâmico**: Implementar política de retentativa exponencial para chamadas da Evolution API e Gemini. -> *Verificar: Resiliência após simulação de queda de API.*
- [ ] **Health Checks**: Criar rota `/api/warmer/health` para monitorar conectividade das instâncias em tempo real. -> *Verificar: Status "Online/Offline" no card do Lab.*

### Fase 3: UI/UX & Modernização (Premium Design)
- [ ] **Interface Futurista**: Aplicar Glassmorphism e Dark Mode no `AdminWarmerPage.tsx` com animações de pulso para instâncias ativas. -> *Verificar: Audit UX com ux_audit.py.*
- [ ] **Feed de Atividade**: Criar um componente de "Terminal" ou Log em tempo real no dashboard para visualizar o diálogo ocorrendo. -> *Verificar: Mensagens aparecendo dinamicamente sem reload.*
- [ ] **Controles Mobile-First**: Otimizar botões de disparo manual para telas touch, usando feedback tátil (Haptic) se possível. -> *Verificar: mobile_audit.py.*

### Fase 4: Inteligência Avançada
- [ ] **Personas Gemini**: Criar um seletor de "Personalidade" (ex: Vendedor, Amigo, Suporte) para diversificar os diálogos da IA. -> *Verificar: Diálogos variados nos logs.*
- [ ] **Contexto de Campanha**: Alimentar a IA com o histórico recente de campanhas para que a maturação use termos similares ao uso real. -> *Verificar: IA citando palavras-chave das campanhas.*

### Fase 5: Limpeza e Consolidação
- [ ] **Legacy Cleanup**: Remover pastas `/backend` e `/supabase` locais, deletar scripts `.cjs` órfãos no root. -> *Verificar: Workspace limpo e apenas arquivos Cloudflare ativos.*

## Critérios de Sucesso
- [ ] Maturador operando 24/7 com intervalos humanos e troca de mídias.
- [ ] Zero crashes no backend por erros de 500 ou SIGTERM.
- [ ] UI visualmente impactante com feedback de status em tempo real.

## Notas
- **Prioridade Máxima**: Fase 1 (Anti-Ban) para proteger os números do usuário imediatamente.
- **Segurança**: Garantir que as mídias no R2 tenham assinaturas temporárias ou sejam excluídas após o uso no Lab.
