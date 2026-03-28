# Plano de Implementação: Módulo Maturador de Chips (WhatsApp Warming)

## 1. Objetivo
Criar um módulo administrativo exclusivo para "maturação" (warming) de chips de WhatsApp. O sistema fará instâncias conversarem de forma autônoma e humanizada, escalonando o volume de mensagens dia a dia para aumentar a reputação dos números antes de campanhas massivas.

## 2. Escopo Arquitetural

### 2.1. Banco de Dados (PostgreSQL via Supabase)
Criaremos duas novas tabelas para gerenciar o maturador:
- **`warmer_configs`**: 
  - `id` (UUID, PK)
  - `instance_a_id` (string/FK para a instância na Evolution API)
  - `instance_b_id` (string/FK para a instância na Evolution API)
  - `phone_a` (string)
  - `phone_b` (string)
  - `status` (enum: 'active', 'paused', 'error')
  - `base_daily_limit` (integer, ex: 10)
  - `increment_per_day` (integer, ex: 10)
  - `start_date` (timestamp)
  - `business_hours_start` (time, default '08:00')
  - `business_hours_end` (time, default '20:00')
- **`warmer_logs`**:
  - `id` (UUID, PK)
  - `warmer_id` (UUID, FK)
  - `from_phone` (string)
  - `to_phone` (string)
  - `message_type` (enum: 'text', 'emoji', 'audio', 'presence')
  - `content_summary` (text)
  - `sent_at` (timestamp)

### 2.2. Lógica de Backend (Worker / Cronjob)
O backend (via `src/queueWorker.js` ou um novo `src/warmerWorker.js`) executará periodicamente as seguintes rotinas:
1. **Controle de Horário (Descanso):** Verifica se o horário atual está dentro da janela `business_hours_start` e `business_hours_end`. Se não, entra em "sleep mode".
2. **Escalonamento de Volume:** Calcula o limite diário atual com base nos dias corridos desde `start_date`: 
   `limite_hoje = base_daily_limit + (dias_passados * increment_per_day)`.
3. **Contagem Diária:** Verifica no banco `warmer_logs` quantas mensagens já foram enviadas **hoje** por este `warmer_id`. Se o `limite_hoje` for atingido, não envia mais nada até o dia seguinte.
4. **Agendamento Dinâmico (Delay Humanizado):** O worker roda ex. a cada 1-5 minutos. Para evitar rajadas previsíveis, utiliza um "jitter" (um delay aleatório entre o disparo do worker e a chamada real à API). 
5. **Comportamento Mútuo:** Ao decidir enviar, o worker alterna aleatoriamente quem é o remetente (Instância A envia para B, ou B envia para A).
6. **Geração de Conteúdo:** 
   - **Textos:** Uso de um dicionário rotativo interno (ex: "Opa", "Bom dia", "Tudo certo?", "Vi aquela notícia...") ou integração com a própria camada de IA Gemini para simular diálogo.
   - **Emojis:** Envio esporádico de reações.
   - **Áudios:** Envio eventual de um arquivo .ogg pré-mapeado, usando a rota de áudio gravado.
   - **Presença:** Antes da mensagem real, o sistema dispara a rota `/chat/sendPresence` (`composing` ou `recording`), aguarda 3-10 segundos, e depois envia a mensagem real (simulação real de digitação).

### 2.3. Integração com Evolution API
Utilizaremos `fetch` ou o `EvolutionService` existente para os seguintes endpoints:
- `POST /instance/fetchInstances` (Listar instâncias para o admin selecionar no Front)
- `POST /chat/sendPresence` (Simular "digitando" / "gravando")
- `POST /message/sendText` (Mensagem de texto / emoji)
- `POST /message/sendWhatsAppAudio` (Áudio)

### 2.4. Frontend (Painel Admin)
- **Rota:** `/admin/warmer`
- **Componentes:**
  - `WarmerList`: Tabela mostrando as rotinas ativas, status do progresso (mensagens hoje / limite hoje).
  - `WarmerForm`: Modal para iniciar nova maturação. Permite selecionar qual instância conversa com qual (A x B).
  - `WarmerLogsModal`: Visualização de timeline das mensagens enviadas hoje/historicamente para auditar a funcionalidade.
- A página será protegida por RBAC (`requiredRole="admin"`).

## 3. Estratégia de Implementação (Orquestração)

**Fase 1: Preparação do Banco de Dados (`database-architect`)**
- Escrever `migration-add-warmer.sql` para criar `warmer_configs` e `warmer_logs`. Atualizar os tipos/enums se aplicável.

**Fase 2: Motor Backend & Worker (`backend-specialist`)**
- Criar novo worker/script: `warmerWorker.js` que acorda periodicamente (ex: `setInterval` a cada 2 mins) e faz query de `warmer_configs` ativas dentro de horário comercial.
- Criar logótipos de frases aleatórias ou mock de resposta Gemini integrados nativos no backend.
- Exemplo assíncrono:
  ```javascript
  // 1. Enviar Status 'digitando'
  await evolutionApi.post('/chat/sendPresence/InstanceA', { number: phoneB, presence: 'composing' });
  // 2. Aguarda delay humano baseado no tamanho do texto
  await sleep(randomMs(2000, 6000));
  // 3. Envia mensagem de texto
  await evolutionApi.post('/message/sendText/InstanceA', { number: phoneB, options: { delay: 100 }, textMessage: { text: "Tudo bem e você?" } });
  // 4. Log no banco
  await db.query('INSERT INTO warmer_logs...');
  ```

**Fase 3: Criar Interface Web (`frontend-specialist`)**
- Criar a página React (`src/pages/AdminWarmerPage.tsx`) com a listagem + formulário.
- Inserir link no componente Sidebar, apenas visível pro grupo Admin.

**Fase 4: Testes & Validação (`test-engineer`)**
- Garantir que o escalonamento numérico no limite não ultrapassa os tetos globais de disparo do Whatsapp (ex: max 300 numa fase avançada).
- Validar se o delay e o envio assíncrono evitam gargalos de threads de Node na VPS.
