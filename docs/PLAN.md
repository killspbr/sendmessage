# Plano Lógico: Remoção Completa do n8n e Integração Direta com Evolution API

## 1. Objetivo
O usuário deseja remover completamente qualquer dependência, menção e integração com o webhook do **n8n** do sistema, passando a utilizar **integração direta** com a Evolution API (e possivelmente chamadas diretas ou SMTP/API próprias para emails caso existam) em todas as telas, configurações e lógicas de disparo. Esse plano guiará as mudanças nos aplicativos Frontend e Backend.

## 2. Escopo da Transformação

### Fase 1: Backend (`backend-specialist`)
1. **Remover Endpoints Legados:**
   - Excluir o endpoint `POST /api/n8n/trigger` do arquivo `backend/src/index.js`.
2. **Atualização da Tabela de Usuários / Perfil:**
   - Remover os campos ligados ao n8n nas chamadas de `allowedFields` no PUT de `/api/admin/users/:id/settings`. (ex: `webhook_email_url` caso dependa do n8n). Se for necessário migrar para um SMTP direto, será avaliado, mas a meta atual é remover o n8n.
3. **Limpeza de Variáveis de Ambiente:**
   - Remover validações e fallback para `N8N_WEBHOOK_URL`.

### Fase 2: Frontend (`frontend-specialist`)
1. **Configurações de Usuário (`UserSettingsPage.tsx`) e Admin (`SettingsPage.tsx`):**
   - Remover completamente a seção "Webhooks/Email (n8n Webhook)"
   - Remover textos de ajuda e placeholders referenciando n8n.
   - Omitir o campo de URL de webhook das chamadas à API de perfil visual.
2. **Lógica de Disparo (`App.tsx` / `useCampaigns.ts`):**
   - Na função `handleContinueCampaign` (onde os disparos acontecem), substituir a montagem do payload que enviava para `endpoint: '/api/n8n/trigger'` e fazer com que todo o tráfego ("whatsapp" e possivelmente outros canais suportados) funcione acionando exclusivamente a rota `/api/campaigns/:id/send` ou rotas da Evolution API.
   - O código que faz o fallback dependendo de Webhook precisa de revisão.
3. **Página de Contatos / Campanhas (`ContactsPage.tsx`, `CampaignsPage.tsx` etc.):**
   - Remover qualquer botão de "Pré-visualizar payload n8n".
   - Ajustar as strings informativas e as exibições no fluxo de envio.

### Fase 3: Revisão e Validação (`test-engineer`, `security-auditor`)
1. Verificar todo o código restante usando scripts como `lint_runner.py` e `security_scan.py`.
2. Garantir que a build conclui com sucesso (`npm run build`).
3. Checar dependências ociosas.

## 3. Critérios de Conclusão e Teste
- [ ] A aplicação transpila, rodando `vite build`.
- [ ] Nenhum texto com base em `n8n` deve ser observado na interface.
- [ ] O disparo de WhatsApp será validado como funcional sendo processado estritamente pelas APIs de Envio configuradas, sem proxy de webhooks n8n.
