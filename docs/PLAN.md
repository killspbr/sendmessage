# Plano de Orquestração: Auditoria e Exibição de Erros de Mídia (PDF/Áudio)

## 📌 Contexto e Diagnóstico
O usuário reportou que campanhas contendo imagens, textos, PDFs e áudios estão falhando parcialmente (apenas imagem e contato chegam). O sistema não exibe motivos claros para a falha na interface, frustrando o diagnóstico operacional.

**Achados da Auditoria Inicial (`backend-specialist` view):**
1. O backend registra internamente o disparo (e eventuais erros) na tabela `contact_send_history`.
2. O envio de algumas mídias falha porque elas possuem um formato de armazenamento `storage_path` legado que aponta para `/app/storage/uploads/...` (arquivos pré-migração Cloudflare R2), resultando em falha ao resgatar do Storage R2 e engatilhando um limite fatal de Loopback HTTP 1042 no Worker.
3. A interface do frontend lê o histórico de envios, mas em `CampaignsPage` (modal de Relatórios inline), ela apenas exibe "✓ Sucesso" ou "✗ Erros" sem revelar o `errorDetail` armazenado, mascarando o erro crítico de arquivos legados de forma invisível.

## 🎯 Objetivo
Fornecer transparência e auditoria de erros direto na UI do sistema, explicitando imediatamente arquivos truncados, quebrados ou não suportados durante o disparo das campanhas.

## 🧩 Fase 1: Interface e Frontend (`frontend-specialist`)
- [ ] Atualizar o componente modal de relatórios inline em `CampaignsPage.tsx`.
- [ ] Adicionar suporte a expansão de linha ou tooltip para exibir a prop `entry.errorDetail`.
- [ ] Criar badge vermelha visual ("Erro no Serviço") que destaca de cara qual conteúdo exato (ex: PDF catálogo, Áudio de boa noite) falhou e a descrição enviada pelo Cloudflare Worker/Evolution API.

## 🧩 Fase 2: Robustez Backend (`backend-specialist`)
- [ ] Implementar verificação seletiva em `campaignDelivery.ts`. Se o `storage_path` capturado do DB apontar pra um diretório Linux legado (`/app/storage/...`) alertar com erro explícito que aquele arquivo está expirado/offline (precisa fazer upload novamente).
- [ ] Modificar o retorno de falha 1042 para dar uma mensagem muito amigável com Ação Sugerida no `historyEntry` ("Falha na Mídia X: O arquivo não está mais hospedado no sistema. Remova este anexo e faça o upload dele novamente.").

## 🛠️ Fase 3: Verificação (`test-engineer` & `debugger`)
- [ ] Validar a leitura e parsing do `errorDetail` na tabela Frontend.
- [ ] Rodar os scripts do Checkpoint Automático: `lint-runner` e `security_scan`.
