# Plano de Implementação: Padronização do Prefixo 'public.' no Backend Cloudflare

Este plano descreve as etapas para garantir que todas as consultas SQL no backend Cloudflare utilizem explicitamente o prefixo `public.` para todas as tabelas e relacionamentos. Isso é crítico para a estabilidade do sistema ao usar Cloudflare Hyperdrive com PostgreSQL.

## 🎯 Objetivos
- Encontrar todas as consultas SQL que não utilizam o prefixo `public.`.
- Atualizar os arquivos para incluir o prefixo.
- Garantir que migrações e comandos DDL também sigam este padrão.

## 📂 Arquivos Afetados
Baseado na auditoria inicial, os seguintes arquivos precisam de revisão/correção:

### Rotas (`cloudflare-backend/src/routes/`)
- `status.ts`
- `instanceLab.ts`
- `schedules.ts`
- `adminOps.ts`
- `adminUsers.ts`
- `ai.ts`
- `history.ts`
- `listsContacts.ts`
- `profileSettings.ts`
- `uploads.ts`

### Bibliotecas (`cloudflare-backend/src/lib/`)
- `campaignDelivery.ts`
- `mediaResolver.ts`
- `sendHistory.ts`
- `uploads.ts`
- `db.ts` (checagem de conexões/inicialização)

## 🛠️ Passos de Implementação

### Fase 1: Correção nos Arquivos Críticos de Rotas
1. **`status.ts`**: Corrigir consultas de histórico e configurações.
2. **`instanceLab.ts`**: Corrigir DDLs (CREATE TABLE) e consultas de logs/runs que ainda estão sem prefixo.
3. **`schedules.ts`**: Corrigir consultas de fila de mensagens e agendamentos.
4. **`listsContacts.ts`**: Corrigir consultas de contatos e listas.

### Fase 2: Correção nas Demais Rotas
1. **`adminOps.ts`** & **`adminUsers.ts`**: Garantir prefixo em operações administrativas.
2. **`ai.ts`**: Corrigir logs de uso de IA e chaves Gemini.
3. **`history.ts`** & **`profileSettings.ts`**: Corrigir consultas de perfil e histórico de envios.
4. **`uploads.ts`**: Corrigir referências a arquivos carregados por usuários.

### Fase 3: Correção nas Bibliotecas (Lib)
1. **`campaignDelivery.ts`**: Garantir que as lógicas de disparo que consultam o banco usem `public.`.
2. **`sendHistory.ts`**: Padronizar inserções no histórico.
3. **`mediaResolver.ts`**: Padronizar buscas de mídia.

### Fase 4: Verificação Final
1. Executar um `grep` final para garantir que nenhuma instância foi esquecida.
2. Validar o deploy no ambiente Cloudflare.

## 🧪 Critérios de Aceite
- Nenhuma consulta SQL no backend Cloudflare faz referência a tabelas sem o prefixo `public.`.
- O sistema carrega o dashboard e as listas de contatos sem erros de "relation not found".
- Disparos de campanha e laboratório de instâncias funcionam corretamente.
