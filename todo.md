# TODO do projeto SendMessage

> **Backlog técnico completo com orientações de implementação**

---

## 📊 Priorização Geral

| Prioridade | Item | Esforço | Impacto |
|------------|------|---------|---------|
| 🔴 Alta | Geração de Conteúdo com IA | Médio | Alto |
| 🔴 Alta | Agendamento de Campanhas | Médio | Alto |
| 🟡 Média | Templates de Campanhas | Baixo | Médio |
| 🟡 Média | Analytics e Relatórios | Médio | Alto |
| 🟡 Média | Importação Inteligente | Médio | Médio |
| 🟢 Baixa | Segmentação Avançada | Alto | Alto |
| 🟢 Baixa | Webhooks de Eventos | Médio | Médio |
| 🟢 Baixa | Modo Escuro | Baixo | Baixo |
| 🟢 Baixa | PWA | Baixo | Médio |
| 🟢 Baixa | Testes Automatizados | Alto | Alto |

---

## 🔴 ALTA PRIORIDADE

---

### 1. Geração de Conteúdo com IA Integrada ao Editor

**Descrição:**  
Integrar a API do Google Gemini (ou OpenAI) diretamente no editor TinyMCE para gerar, reescrever e otimizar o conteúdo das campanhas com inteligência artificial.

**Funcionalidades:**
- [ ] Botão "Gerar com IA" na barra do editor que abre um modal para o usuário descrever o que deseja
- [ ] Reescrever seleção: selecionar um trecho e pedir para a IA reformular, resumir ou expandir
- [ ] Sugestões de assunto/título para campanhas de email
- [ ] Correção ortográfica e gramatical automática
- [ ] Tradução do conteúdo para outros idiomas
- [ ] Geração de variações A/B do mesmo conteúdo para testes

**Implementação Técnica:**

1. **Novo componente React:**

```typescript
// src/components/AiContentGenerator.tsx
type AiContentGeneratorProps = {
  geminiApiKey: string
  currentContent: string
  onInsertContent: (content: string) => void
}

// Chamada à API Gemini
const generateContent = async (prompt: string, apiKey: string): Promise<string> => {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        },
      }),
    }
  )
  const data = await response.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
}
```

2. **Integração com TinyMCE:**

```typescript
// No init do Editor TinyMCE, adicionar botão customizado:
setup: (editor) => {
  editor.ui.registry.addButton('aiGenerate', {
    text: '✨ IA',
    tooltip: 'Gerar conteúdo com IA',
    onAction: () => {
      // Abre modal de geração
      setAiModalOpen(true)
    },
  })
},
toolbar: '... | aiGenerate',
```

3. **Banco de Dados (opcional, para auditoria):**

```sql
create table public.ai_generation_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  campaign_id uuid references campaigns(id),
  prompt text,
  generated_content text,
  model text,
  created_at timestamptz default now()
);
```

---

### 2. Agendamento de Campanhas

**Descrição:**  
Permitir agendar o disparo de campanhas para uma data/hora específica, com suporte a fuso horário.

**Funcionalidades:**
- [ ] Seletor de data/hora no editor de campanha
- [ ] Fila de campanhas agendadas com status visual
- [ ] Cancelamento de agendamento
- [ ] Notificação quando a campanha for disparada

**Implementação Técnica:**

1. **Alterações no banco de dados:**

```sql
-- Adicionar colunas na tabela campaigns
alter table public.campaigns
  add column scheduled_at timestamptz,
  add column timezone text default 'America/Sao_Paulo';

-- Criar tabela de jobs para o backend processar
create table public.scheduled_jobs (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references campaigns(id) on delete cascade,
  user_id uuid references auth.users(id),
  scheduled_at timestamptz not null,
  status text default 'pending', -- pending, processing, completed, failed
  started_at timestamptz,
  completed_at timestamptz,
  error_message text,
  created_at timestamptz default now()
);

create index idx_jobs_scheduled on scheduled_jobs(scheduled_at) where status = 'pending';
```

2. **Worker no backend (roda a cada minuto):**

```typescript
// backend/src/workers/campaignScheduler.ts
const processScheduledCampaigns = async () => {
  const now = new Date()
  
  const { data: jobs } = await supabase
    .from('scheduled_jobs')
    .select('*, campaigns(*)')
    .eq('status', 'pending')
    .lte('scheduled_at', now.toISOString())
    .limit(10)
  
  for (const job of jobs ?? []) {
    await supabase
      .from('scheduled_jobs')
      .update({ status: 'processing', started_at: now.toISOString() })
      .eq('id', job.id)
    
    try {
      // Dispara a campanha
      await triggerCampaign(job.campaigns)
      
      await supabase
        .from('scheduled_jobs')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', job.id)
    } catch (error) {
      await supabase
        .from('scheduled_jobs')
        .update({ status: 'failed', error_message: error.message })
        .eq('id', job.id)
    }
  }
}
```

3. **Frontend:**
- Usar biblioteca `react-datepicker` ou similar para seletor de data/hora
- Adicionar campo `scheduledAt` no estado do editor de campanha
- Exibir badge "Agendada para XX/XX às HH:MM" na lista de campanhas

---

### 2.1 Organização dos disparos (campanhas concorrentes)

**Descrição:**  
Definir claramente como o sistema organiza os disparos quando houver mais de uma campanha sendo enviada ou continuada para o mesmo usuário, evitando sobreposição de envios e mantendo o histórico consistente.

**Regras de negócio atuais (documentadas):**
- [x] Apenas **uma campanha por vez** pode estar em envio (`sendingCampaignId` único).  
  Se o usuário tentar iniciar o envio de outra campanha enquanto já existe uma ativa, o sistema bloqueia com mensagem: _"Já existe uma campanha sendo enviada. Aguarde finalizar para iniciar outra."_
- [x] O progresso de envio (índice atual, total, erros) é global e mostrado na barra superior e no Dashboard.
- [x] O histórico detalhado **por contato/canal** é gravado em `contact_send_history` e usado tanto no Dashboard quanto nos Relatórios.
- [x] A continuação de campanha (`handleContinueCampaign`) só envia para contatos/canais que **ainda não tiveram envio bem-sucedido** (baseado em `contact_sendHistory`).

**Melhorias planejadas:**
- [ ] Documentar no código (comentários breves) que `sendingCampaignId` é o _lock_ lógico para impedir envios concorrentes por usuário.
- [ ] Centralizar a função de **recarregar histórico de envios** a partir do Supabase (já existe `reloadContactSendHistory`) e garantir que ela seja sempre chamada após o término de um disparo ou continuação.
- [ ] No Dashboard, exibir badge/resumo indicando se há campanha com envios pendentes (contatos ainda não disparados) e oferecer atalho para "Continuar envio".
- [ ] Incluir no módulo de Relatórios uma indicação de que os números refletem sempre o que está persistido em `contact_send_history` (não apenas estado em memória).

---

## 🟡 MÉDIA PRIORIDADE

---

### 3. Templates de Campanhas

**Descrição:**  
Biblioteca de templates pré-definidos e personalizáveis para acelerar a criação de campanhas.

**Funcionalidades:**
- [ ] Templates do sistema: modelos prontos para diferentes segmentos (restaurantes, clínicas, varejo, etc.)
- [ ] Templates do usuário: salvar campanhas como templates reutilizáveis
- [ ] Categorização e busca de templates
- [ ] Preview antes de aplicar

**Implementação Técnica:**

1. **Banco de dados:**

```sql
create table public.campaign_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id), -- null = template do sistema
  name text not null,
  category text,
  description text,
  message text not null,
  channels text[] default array['whatsapp'],
  is_public boolean default false,
  created_at timestamptz default now()
);

create index idx_templates_user on campaign_templates(user_id);
create index idx_templates_category on campaign_templates(category);
```

2. **Tipo TypeScript:**

```typescript
type CampaignTemplate = {
  id: string
  name: string
  category: string
  description: string
  message: string
  channels: CampaignChannel[]
  isPublic: boolean
}
```

3. **Hook para carregar templates:**

```typescript
const useTemplates = (userId: string) => {
  const [templates, setTemplates] = useState<CampaignTemplate[]>([])
  
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('campaign_templates')
        .select('*')
        .or(`user_id.eq.${userId},is_public.eq.true`)
        .order('name')
      setTemplates(data ?? [])
    }
    load()
  }, [userId])
  
  return templates
}
```

---

### 4. Analytics e Relatórios Avançados

**Descrição:**  
Dashboard com métricas detalhadas de performance das campanhas, incluindo gráficos interativos.

**Funcionalidades:**
- [ ] Taxa de entrega por canal (WhatsApp vs Email)
- [ ] Gráficos de linha mostrando envios ao longo do tempo
- [ ] Mapa de calor de horários com melhor engajamento
- [ ] Comparativo entre campanhas
- [ ] Exportação de relatórios em PDF/Excel

**Implementação Técnica:**

1. **Instalar biblioteca de gráficos:**

```bash
npm install recharts
```

2. **Componente de gráfico:**

```typescript
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const SendsOverTimeChart = ({ data }: { data: { date: string; sends: number; errors: number }[] }) => (
  <ResponsiveContainer width="100%" height={300}>
    <LineChart data={data}>
      <XAxis dataKey="date" />
      <YAxis />
      <Tooltip />
      <Line type="monotone" dataKey="sends" stroke="#10b981" name="Enviados" />
      <Line type="monotone" dataKey="errors" stroke="#ef4444" name="Erros" />
    </LineChart>
  </ResponsiveContainer>
)
```

3. **View materializada no banco (performance):**

```sql
create materialized view campaign_stats as
select
  c.id as campaign_id,
  c.name as campaign_name,
  c.user_id,
  count(csh.id) as total_sends,
  count(csh.id) filter (where csh.ok = true) as successful_sends,
  count(csh.id) filter (where csh.ok = false) as failed_sends,
  count(distinct csh.phone_key) as unique_contacts,
  min(csh.run_at) as first_send_at,
  max(csh.run_at) as last_send_at
from campaigns c
left join contact_send_history csh on csh.campaign_id = c.id
group by c.id, c.name, c.user_id;

-- Atualizar periodicamente
refresh materialized view campaign_stats;
```

---

### 5. Importação Inteligente de Contatos

**Descrição:**  
Melhorar a importação de contatos com detecção automática de colunas, validação e enriquecimento de dados.

**Funcionalidades:**
- [ ] Detecção automática de colunas (nome, telefone, email, etc.)
- [ ] Validação de telefone com formatação automática
- [ ] Validação de email com verificação de sintaxe
- [ ] Enriquecimento via CEP: buscar cidade e endereço automaticamente
- [ ] Detecção de duplicatas antes de importar
- [ ] Preview interativo com correções manuais

**Implementação Técnica:**

1. **Função de detecção automática de colunas:**

```typescript
const detectColumnType = (values: string[]): string => {
  const sample = values.filter(Boolean).slice(0, 10)
  
  // Detecta telefone
  const phonePattern = /^[\d\s\-\(\)\+]+$/
  if (sample.every((v) => phonePattern.test(v) && v.replace(/\D/g, '').length >= 10)) {
    return 'phone'
  }
  
  // Detecta email
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (sample.every((v) => emailPattern.test(v))) {
    return 'email'
  }
  
  // Detecta CEP
  const cepPattern = /^\d{5}-?\d{3}$/
  if (sample.every((v) => cepPattern.test(v))) {
    return 'cep'
  }
  
  // Detecta categoria (valores repetidos)
  const uniqueRatio = new Set(sample).size / sample.length
  if (uniqueRatio < 0.3) {
    return 'category'
  }
  
  return 'name' // fallback
}
```

2. **Validação de telefone brasileiro:**

```typescript
const validateBrazilianPhone = (phone: string): { valid: boolean; formatted: string } => {
  const digits = phone.replace(/\D/g, '')
  
  if (digits.length === 11 && digits[2] === '9') {
    return { valid: true, formatted: `+55${digits}` }
  }
  if (digits.length === 13 && digits.startsWith('55') && digits[4] === '9') {
    return { valid: true, formatted: `+${digits}` }
  }
  
  return { valid: false, formatted: phone }
}
```

---

## 🟢 BAIXA PRIORIDADE

---

### 6. Segmentação Avançada de Contatos

**Descrição:**  
Criar segmentos dinâmicos de contatos baseados em regras e filtros, permitindo campanhas mais direcionadas.

**Funcionalidades:**
- [ ] Construtor visual de regras (ex: "categoria = Pizzaria E cidade = São Paulo")
- [ ] Segmentos dinâmicos que atualizam automaticamente
- [ ] Segmentos estáticos (snapshot de contatos)
- [ ] Estimativa de alcance antes do disparo

**Implementação Técnica:**

1. **Banco de dados:**

```sql
create table public.segments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  name text not null,
  description text,
  rules jsonb not null, -- ex: {"operator": "AND", "conditions": [...]}
  is_dynamic boolean default true,
  contact_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.segment_contacts (
  segment_id uuid references segments(id) on delete cascade,
  contact_id uuid references contacts(id) on delete cascade,
  added_at timestamptz default now(),
  primary key (segment_id, contact_id)
);
```

2. **Tipos TypeScript:**

```typescript
type SegmentCondition = {
  field: 'category' | 'city' | 'rating' | 'email' | 'phone' | 'created_at'
  operator: 'equals' | 'not_equals' | 'contains' | 'starts_with' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty'
  value: string | number | null
}

type SegmentRules = {
  operator: 'AND' | 'OR'
  conditions: SegmentCondition[]
}
```

3. **Função para converter regras em query SQL:**

```typescript
const buildSegmentQuery = (rules: SegmentRules, userId: string): string => {
  const conditions = rules.conditions.map((c) => {
    switch (c.operator) {
      case 'equals': return `${c.field} = '${c.value}'`
      case 'contains': return `${c.field} ilike '%${c.value}%'`
      case 'is_empty': return `(${c.field} is null or ${c.field} = '')`
      // ... outros operadores
    }
  })
  
  const joined = conditions.join(` ${rules.operator} `)
  return `select * from contacts where user_id = '${userId}' and (${joined})`
}
```

---

### 7. Webhooks de Eventos (Outgoing)

**Descrição:**  
Permitir que o usuário configure webhooks para receber notificações de eventos do sistema em tempo real.

**Funcionalidades:**
- [ ] Eventos disponíveis: campanha iniciada, campanha finalizada, erro de envio, novo contato, etc.
- [ ] Configuração de URL por evento
- [ ] Retry automático em caso de falha
- [ ] Log de chamadas para debug

**Implementação Técnica:**

1. **Banco de dados:**

```sql
create table public.user_webhooks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  event_type text not null, -- campaign.started, campaign.completed, send.failed, etc.
  url text not null,
  secret text, -- para assinatura HMAC
  is_active boolean default true,
  created_at timestamptz default now()
);

create table public.webhook_logs (
  id uuid primary key default gen_random_uuid(),
  webhook_id uuid references user_webhooks(id),
  event_type text,
  payload jsonb,
  response_status integer,
  response_body text,
  attempt integer default 1,
  created_at timestamptz default now()
);
```

2. **Função para disparar webhook:**

```typescript
const triggerWebhook = async (
  userId: string,
  eventType: string,
  payload: Record<string, any>
) => {
  const { data: webhooks } = await supabase
    .from('user_webhooks')
    .select('*')
    .eq('user_id', userId)
    .eq('event_type', eventType)
    .eq('is_active', true)
  
  for (const webhook of webhooks ?? []) {
    const signature = webhook.secret
      ? crypto.createHmac('sha256', webhook.secret).update(JSON.stringify(payload)).digest('hex')
      : undefined
    
    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(signature && { 'X-Webhook-Signature': signature }),
        },
        body: JSON.stringify({ event: eventType, data: payload, timestamp: new Date().toISOString() }),
      })
      
      await supabase.from('webhook_logs').insert({
        webhook_id: webhook.id,
        event_type: eventType,
        payload,
        response_status: response.status,
      })
    } catch (error) {
      // Implementar retry com backoff exponencial
    }
  }
}
```

---

### 8. Modo Escuro (Dark Mode)

**Descrição:**  
Implementar tema escuro para melhor experiência visual e redução de fadiga ocular.

**Funcionalidades:**
- [ ] Toggle manual na interface
- [ ] Detecção automática da preferência do sistema
- [ ] Persistência da escolha no localStorage
- [ ] Transição suave entre temas

**Implementação Técnica:**

1. **Hook para gerenciar tema:**

```typescript
const useTheme = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const stored = localStorage.getItem('sendmessage_theme')
    if (stored === 'dark' || stored === 'light') return stored
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })
  
  useEffect(() => {
    localStorage.setItem('sendmessage_theme', theme)
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])
  
  return { theme, setTheme, toggleTheme: () => setTheme((t) => t === 'light' ? 'dark' : 'light') }
}
```

2. **Configuração do Tailwind:**

```javascript
// tailwind.config.js
module.exports = {
  darkMode: 'class',
  // ...
}
```

3. **Uso nos componentes:**

```tsx
<div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
  ...
</div>
```

---

### 9. PWA (Progressive Web App)

**Descrição:**  
Transformar a aplicação em PWA para permitir instalação no dispositivo e uso offline parcial.

**Funcionalidades:**
- [ ] Instalação como app no desktop e mobile
- [ ] Notificações push para alertas de campanhas
- [ ] Cache offline para visualização de dados
- [ ] Sincronização em background quando voltar online

**Implementação Técnica:**

1. **Manifest:**

```json
// public/manifest.json
{
  "name": "SendMessage",
  "short_name": "SendMessage",
  "description": "Sistema de disparo de campanhas",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#f8fafc",
  "theme_color": "#8b5cf6",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

2. **Service Worker:**

```javascript
// public/sw.js
const CACHE_NAME = 'sendmessage-v1'
const urlsToCache = ['/', '/index.html', '/assets/index.css', '/assets/index.js']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  )
})

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  )
})
```

---

### 10. Testes Automatizados

**Descrição:**  
Implementar suíte de testes para garantir qualidade e evitar regressões.

**Tipos de Testes:**
- [ ] Unitários: funções utilitárias, hooks, validações
- [ ] Integração: fluxos completos (criar campanha, enviar, etc.)
- [ ] E2E: testes de interface com Playwright ou Cypress

**Implementação Técnica:**

1. **Instalar dependências:**

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom playwright
```

2. **Exemplo de teste unitário:**

```typescript
// src/utils/__tests__/normalizePhone.test.ts
import { describe, it, expect } from 'vitest'
import { normalizePhone } from '../normalizePhone'

describe('normalizePhone', () => {
  it('deve remover caracteres não numéricos', () => {
    expect(normalizePhone('(11) 94463-9704')).toBe('11944639704')
  })
  
  it('deve retornar string vazia para input inválido', () => {
    expect(normalizePhone('')).toBe('')
    expect(normalizePhone(null as any)).toBe('')
  })
})
```

3. **Exemplo de teste E2E com Playwright:**

```typescript
// tests/campaigns.spec.ts
import { test, expect } from '@playwright/test'

test('deve criar uma nova campanha', async ({ page }) => {
  await page.goto('/campaigns')
  await page.click('text=Criar campanha')
  await page.fill('input[id="new-campaign-name"]', 'Campanha de Teste')
  await page.fill('.tox-edit-area iframe', 'Conteúdo da campanha')
  await page.click('text=Salvar campanha')
  await expect(page.locator('text=Campanha de Teste')).toBeVisible()
})
```

---

## 🗺️ EXTRAÇÃO DE CONTATOS DO GOOGLE MAPS

### Visão Geral

Funcionalidade para extrair contatos de estabelecimentos do Google Maps de forma gratuita, usando uma extensão de navegador controlada pelo usuário + tela de importação no sistema.

### Arquitetura da Solução

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                         │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐ │
│  │  Tela de    │───▶│  Instruções │───▶│  Área de Colagem/   │ │
│  │  Extração   │    │  + Link     │    │  Importação         │ │
│  └─────────────┘    └─────────────┘    └─────────────────────┘ │
│         │                                        │              │
│         ▼                                        ▼              │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │              Preview + Validação + IA                       ││
│  │  (limpa dados, extrai telefones, formata, detecta duplicatas)│
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EXTENSÃO DO NAVEGADOR                        │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  Content Script: Extrai dados visíveis do Google Maps       ││
│  │  - Nome, Endereço, Telefone, Website, Avaliação, Categoria  ││
│  └─────────────────────────────────────────────────────────────┘│
│                              │                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  Popup: Botão "Copiar para SendMessage" (JSON/CSV)          ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### Fluxo do Usuário

1. **Tela de Extração** - Usuário acessa página "Extração" no SendMessage
2. **Instruções** - Sistema exibe tutorial e link para baixar extensão
3. **Google Maps** - Usuário abre Maps em nova aba e pesquisa (ex: "Pizzarias em SP")
4. **Extensão captura** - Extensão detecta Maps e extrai dados visíveis
5. **Exportar** - Usuário clica "Copiar JSON" na extensão
6. **Importar** - Usuário cola dados na tela de Extração do SendMessage
7. **Preview + IA** - Sistema valida, limpa e permite enriquecer com IA
8. **Salvar** - Usuário confirma importação para uma lista

---

### PARTE 1: Extensão do Navegador (Chrome/Edge)

#### Estrutura de Arquivos

```
sendmessage-extractor/
├── manifest.json
├── popup/
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
├── content/
│   └── content.js
├── background/
│   └── background.js
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

#### manifest.json

```json
{
  "manifest_version": 3,
  "name": "SendMessage Extractor",
  "version": "1.0.0",
  "description": "Extrai contatos do Google Maps para o SendMessage",
  "permissions": ["activeTab", "clipboardWrite", "storage"],
  "host_permissions": [
    "https://www.google.com/maps/*",
    "https://maps.google.com/*"
  ],
  "action": {
    "default_popup": "popup/popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "content_scripts": [
    {
      "matches": ["https://www.google.com/maps/*", "https://maps.google.com/*"],
      "js": ["content/content.js"],
      "run_at": "document_idle"
    }
  ],
  "background": {
    "service_worker": "background/background.js"
  },
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
```

#### content/content.js

```javascript
// Content script que roda no Google Maps
(function() {
  'use strict';

  // Seletores do Google Maps (podem mudar, precisam de manutenção)
  const SELECTORS = {
    resultsList: 'div[role="feed"]',
    resultItem: 'div[role="feed"] > div > div[jsaction]',
    name: 'div.fontHeadlineSmall',
    rating: 'span[role="img"]',
    category: 'button[jsaction*="category"]',
    detailPanel: 'div[role="main"]',
    detailName: 'h1.fontHeadlineLarge',
    detailPhone: 'button[data-item-id*="phone"] div.fontBodyMedium',
    detailWebsite: 'a[data-item-id*="authority"]',
    detailAddress: 'button[data-item-id*="address"] div.fontBodyMedium',
  };

  let extractedContacts = [];
  let isExtracting = false;

  // Função principal de extração
  function extractVisibleContacts() {
    const contacts = [];
    
    // Tenta extrair do painel de detalhes primeiro
    const detailPanel = document.querySelector(SELECTORS.detailPanel);
    if (detailPanel) {
      const contact = extractFromDetailPanel(detailPanel);
      if (contact && contact.name) contacts.push(contact);
    }
    
    // Extrai da lista de resultados
    const resultItems = document.querySelectorAll(SELECTORS.resultItem);
    resultItems.forEach((item, index) => {
      const contact = extractFromListItem(item, index);
      if (contact && contact.name) {
        const exists = contacts.some(c => c.name === contact.name);
        if (!exists) contacts.push(contact);
      }
    });
    
    return contacts;
  }

  // Extrai dados de um item da lista
  function extractFromListItem(item, index) {
    try {
      const nameEl = item.querySelector(SELECTORS.name);
      const ratingEl = item.querySelector(SELECTORS.rating);
      const categoryEl = item.querySelector(SELECTORS.category);
      const allText = item.innerText || '';
      const phoneMatch = allText.match(/\(?\d{2}\)?\s*\d{4,5}[-.\s]?\d{4}/);
      
      return {
        id: `gm_${Date.now()}_${index}`,
        name: nameEl?.innerText?.trim() || '',
        phone: phoneMatch ? normalizePhone(phoneMatch[0]) : '',
        category: categoryEl?.innerText?.trim() || '',
        rating: parseRating(ratingEl?.getAttribute('aria-label') || ''),
        address: extractAddress(item),
        website: '',
        source: 'google_maps',
        extractedAt: new Date().toISOString(),
      };
    } catch (e) {
      console.error('Erro ao extrair item:', e);
      return null;
    }
  }

  // Extrai dados do painel de detalhes
  function extractFromDetailPanel(panel) {
    try {
      const nameEl = panel.querySelector(SELECTORS.detailName);
      const phoneEl = panel.querySelector(SELECTORS.detailPhone);
      const websiteEl = panel.querySelector(SELECTORS.detailWebsite);
      const addressEl = panel.querySelector(SELECTORS.detailAddress);
      const categoryEl = panel.querySelector(SELECTORS.detailCategory);
      
      return {
        id: `gm_detail_${Date.now()}`,
        name: nameEl?.innerText?.trim() || '',
        phone: phoneEl ? normalizePhone(phoneEl.innerText) : '',
        website: websiteEl?.href || '',
        address: addressEl?.innerText?.trim() || '',
        category: categoryEl?.innerText?.trim() || '',
        source: 'google_maps',
        extractedAt: new Date().toISOString(),
      };
    } catch (e) {
      return null;
    }
  }

  // Extrai endereço de um item
  function extractAddress(item) {
    const spans = item.querySelectorAll('span');
    for (const span of spans) {
      const text = span.innerText || '';
      if (text.match(/\d+\s*[-,]\s*\w+/) || text.match(/R\.|Av\.|Rua|Avenida/i)) {
        return text.trim();
      }
    }
    return '';
  }

  // Normaliza telefone
  function normalizePhone(phone) {
    if (!phone) return '';
    const digits = phone.replace(/\D/g, '');
    return (digits.length >= 10 && digits.length <= 13) ? digits : '';
  }

  // Parse de rating
  function parseRating(ariaLabel) {
    if (!ariaLabel) return '';
    const match = ariaLabel.match(/(\d[,.]?\d?)/);
    return match ? match[1].replace(',', '.') : '';
  }

  // Scroll automático para carregar mais resultados
  async function scrollAndExtract(maxScrolls = 10) {
    const feed = document.querySelector(SELECTORS.resultsList);
    if (!feed) return [];
    
    let allContacts = [];
    let previousCount = 0;
    let scrollCount = 0;
    
    while (scrollCount < maxScrolls) {
      const newContacts = extractVisibleContacts();
      newContacts.forEach(contact => {
        const exists = allContacts.some(c => c.name === contact.name);
        if (!exists && contact.name) allContacts.push(contact);
      });
      
      if (allContacts.length === previousCount) break;
      previousCount = allContacts.length;
      
      feed.scrollTop = feed.scrollHeight;
      await new Promise(resolve => setTimeout(resolve, 1500));
      scrollCount++;
      
      chrome.runtime.sendMessage({
        type: 'EXTRACTION_PROGRESS',
        count: allContacts.length,
        scrolls: scrollCount,
      });
    }
    
    return allContacts;
  }

  // Listener para mensagens do popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'EXTRACT_CONTACTS') {
      const contacts = extractVisibleContacts();
      extractedContacts = contacts;
      sendResponse({ success: true, contacts, count: contacts.length });
    }
    
    if (message.type === 'EXTRACT_ALL') {
      isExtracting = true;
      scrollAndExtract(message.maxScrolls || 10).then(contacts => {
        extractedContacts = contacts;
        isExtracting = false;
        chrome.runtime.sendMessage({
          type: 'EXTRACTION_COMPLETE',
          contacts,
          count: contacts.length,
        });
      });
      sendResponse({ success: true, message: 'Extração iniciada' });
    }
    
    if (message.type === 'GET_STATUS') {
      sendResponse({
        isExtracting,
        count: extractedContacts.length,
        isGoogleMaps: window.location.href.includes('google.com/maps'),
      });
    }
    
    return true;
  });

  // Injeta indicador visual na página
  function injectIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'sendmessage-indicator';
    indicator.innerHTML = `
      <div style="
        position: fixed; bottom: 20px; right: 20px;
        background: linear-gradient(135deg, #8b5cf6, #6366f1);
        color: white; padding: 12px 20px; border-radius: 12px;
        font-family: system-ui; font-size: 14px;
        box-shadow: 0 4px 20px rgba(139, 92, 246, 0.4);
        z-index: 999999; display: flex; align-items: center; gap: 8px;
      ">
        <span>📋</span>
        <span>SendMessage Extractor ativo</span>
      </div>
    `;
    document.body.appendChild(indicator);
  }

  if (window.location.href.includes('google.com/maps')) {
    injectIndicator();
    console.log('SendMessage Extractor carregado');
  }
})();
```

#### popup/popup.html

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>SendMessage Extractor</title>
  <link rel="stylesheet" href="popup.css">
</head>
<body>
  <div class="container">
    <header>
      <h1>📋 SendMessage</h1>
      <p class="subtitle">Extrator de Contatos</p>
    </header>
    
    <div id="status" class="status">
      <span class="status-icon">⏳</span>
      <span class="status-text">Verificando...</span>
    </div>
    
    <div id="not-maps" class="message hidden">
      <p>⚠️ Abra o <strong>Google Maps</strong> e faça uma pesquisa.</p>
      <a href="https://www.google.com/maps" target="_blank" class="btn btn-secondary">
        Abrir Google Maps
      </a>
    </div>
    
    <div id="controls" class="controls hidden">
      <div class="count-display">
        <span class="count-number" id="count">0</span>
        <span class="count-label">contatos encontrados</span>
      </div>
      
      <div class="actions">
        <button id="btn-extract" class="btn btn-primary">
          🔍 Extrair Visíveis
        </button>
        <button id="btn-extract-all" class="btn btn-secondary">
          📜 Extrair Todos (scroll)
        </button>
      </div>
      
      <div id="progress" class="progress hidden">
        <div class="progress-bar"><div class="progress-fill" id="progress-fill"></div></div>
        <p class="progress-text" id="progress-text">Extraindo...</p>
      </div>
      
      <div class="export-actions hidden" id="export-actions">
        <button id="btn-copy" class="btn btn-success">📋 Copiar JSON</button>
        <button id="btn-copy-csv" class="btn btn-outline">📄 Copiar CSV</button>
      </div>
    </div>
    
    <footer>
      <p>Cole os dados na tela de Extração do SendMessage</p>
    </footer>
  </div>
  <script src="popup.js"></script>
</body>
</html>
```

#### popup/popup.js

```javascript
document.addEventListener('DOMContentLoaded', async () => {
  const statusEl = document.getElementById('status');
  const notMapsEl = document.getElementById('not-maps');
  const controlsEl = document.getElementById('controls');
  const countEl = document.getElementById('count');
  const btnExtract = document.getElementById('btn-extract');
  const btnExtractAll = document.getElementById('btn-extract-all');
  const btnCopy = document.getElementById('btn-copy');
  const btnCopyCsv = document.getElementById('btn-copy-csv');
  const exportActions = document.getElementById('export-actions');
  const progressEl = document.getElementById('progress');
  const progressFill = document.getElementById('progress-fill');
  const progressText = document.getElementById('progress-text');

  let extractedContacts = [];

  // Verifica se está no Google Maps
  async function checkStatus() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab.url.includes('google.com/maps')) {
        statusEl.innerHTML = '<span>❌</span><span>Não está no Google Maps</span>';
        statusEl.classList.add('error');
        notMapsEl.classList.remove('hidden');
        controlsEl.classList.add('hidden');
        return false;
      }

      const response = await chrome.tabs.sendMessage(tab.id, { type: 'GET_STATUS' });
      statusEl.innerHTML = '<span>✅</span><span>Google Maps detectado</span>';
      statusEl.classList.add('success');
      notMapsEl.classList.add('hidden');
      controlsEl.classList.remove('hidden');
      
      if (response.count > 0) {
        countEl.textContent = response.count;
        exportActions.classList.remove('hidden');
      }
      return true;
    } catch (e) {
      statusEl.innerHTML = '<span>⚠️</span><span>Recarregue a página do Maps</span>';
      return false;
    }
  }

  // Extrai contatos visíveis
  btnExtract.addEventListener('click', async () => {
    btnExtract.disabled = true;
    btnExtract.textContent = '⏳ Extraindo...';
    
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const response = await chrome.tabs.sendMessage(tab.id, { type: 'EXTRACT_CONTACTS' });
    
    if (response.success) {
      extractedContacts = response.contacts;
      countEl.textContent = response.count;
      exportActions.classList.remove('hidden');
    }
    
    btnExtract.disabled = false;
    btnExtract.textContent = '🔍 Extrair Visíveis';
  });

  // Extrai todos com scroll
  btnExtractAll.addEventListener('click', async () => {
    btnExtractAll.disabled = true;
    btnExtract.disabled = true;
    progressEl.classList.remove('hidden');
    
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    await chrome.tabs.sendMessage(tab.id, { type: 'EXTRACT_ALL', maxScrolls: 15 });
  });

  // Listener para progresso
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'EXTRACTION_PROGRESS') {
      countEl.textContent = message.count;
      progressFill.style.width = `${(message.scrolls / 15) * 100}%`;
      progressText.textContent = `Extraindo... ${message.count} contatos`;
    }
    
    if (message.type === 'EXTRACTION_COMPLETE') {
      extractedContacts = message.contacts;
      countEl.textContent = message.count;
      progressEl.classList.add('hidden');
      exportActions.classList.remove('hidden');
      btnExtractAll.disabled = false;
      btnExtract.disabled = false;
    }
  });

  // Copiar JSON
  btnCopy.addEventListener('click', async () => {
    await navigator.clipboard.writeText(JSON.stringify(extractedContacts, null, 2));
    btnCopy.textContent = '✅ Copiado!';
    setTimeout(() => btnCopy.textContent = '📋 Copiar JSON', 2000);
  });

  // Copiar CSV
  btnCopyCsv.addEventListener('click', async () => {
    const headers = ['nome', 'telefone', 'endereco', 'categoria', 'avaliacao', 'website'];
    const rows = extractedContacts.map(c => [
      c.name, c.phone, c.address, c.category, c.rating, c.website
    ].map(v => `"${(v || '').replace(/"/g, '""')}"`).join(','));
    
    const csv = [headers.join(','), ...rows].join('\n');
    await navigator.clipboard.writeText(csv);
    btnCopyCsv.textContent = '✅ Copiado!';
    setTimeout(() => btnCopyCsv.textContent = '📄 Copiar CSV', 2000);
  });

  await checkStatus();
});
```

#### background/background.js

```javascript
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'EXTRACTION_PROGRESS' || message.type === 'EXTRACTION_COMPLETE') {
    chrome.runtime.sendMessage(message);
  }
  return true;
});
```

---

### PARTE 2: Frontend SendMessage (Tela de Extração)

#### Criar arquivo: src/pages/ExtractionPage.tsx

```typescript
import { useState, useCallback } from 'react'
import { MapPin, Search, Upload, Sparkles, AlertCircle, CheckCircle2, Download, ExternalLink } from 'lucide-react'

type ExtractedContact = {
  id: string
  name: string
  phone: string
  email?: string
  address?: string
  category?: string
  rating?: string
  website?: string
  source: string
  extractedAt: string
}

type ExtractionPageProps = {
  onImportContacts: (contacts: ExtractedContact[], listId: string) => Promise<void>
  lists: { id: string; name: string }[]
  geminiApiKey?: string
}

export default function ExtractionPage({ onImportContacts, lists, geminiApiKey }: ExtractionPageProps) {
  const [step, setStep] = useState<'instructions' | 'paste' | 'preview' | 'importing'>('instructions')
  const [pastedData, setPastedData] = useState('')
  const [parsedContacts, setParsedContacts] = useState<ExtractedContact[]>([])
  const [parseError, setParseError] = useState<string | null>(null)
  const [selectedListId, setSelectedListId] = useState<string>('')
  const [isEnriching, setIsEnriching] = useState(false)

  // Parse dos dados colados (JSON ou CSV)
  const handleParse = useCallback(() => {
    setParseError(null)
    try {
      const trimmed = pastedData.trim()
      
      // Tenta JSON primeiro
      if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        const parsed = JSON.parse(trimmed)
        const contacts = Array.isArray(parsed) ? parsed : [parsed]
        setParsedContacts(contacts)
        setStep('preview')
        return
      }
      
      // Tenta CSV
      const lines = trimmed.split('\n')
      if (lines.length < 2) throw new Error('Dados insuficientes')
      
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''))
      const contacts: ExtractedContact[] = []
      
      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i])
        if (values.length !== headers.length) continue
        
        const contact: any = {
          id: `import_${Date.now()}_${i}`,
          source: 'csv_import',
          extractedAt: new Date().toISOString(),
        }
        
        headers.forEach((header, idx) => {
          const value = values[idx]?.trim() || ''
          if (header.includes('nome') || header === 'name') contact.name = value
          else if (header.includes('telefone') || header === 'phone') contact.phone = normalizePhone(value)
          else if (header.includes('email')) contact.email = value
          else if (header.includes('endereco') || header === 'address') contact.address = value
          else if (header.includes('categoria') || header === 'category') contact.category = value
          else if (header.includes('avaliacao') || header === 'rating') contact.rating = value
          else if (header.includes('website') || header === 'site') contact.website = value
        })
        
        if (contact.name) contacts.push(contact as ExtractedContact)
      }
      
      if (contacts.length === 0) throw new Error('Nenhum contato válido encontrado')
      setParsedContacts(contacts)
      setStep('preview')
    } catch (e: any) {
      setParseError(e.message || 'Erro ao processar dados')
    }
  }, [pastedData])

  // Parse de linha CSV
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    
    for (const char of line) {
      if (char === '"') inQuotes = !inQuotes
      else if (char === ',' && !inQuotes) {
        result.push(current.replace(/^"|"$/g, ''))
        current = ''
      } else current += char
    }
    result.push(current.replace(/^"|"$/g, ''))
    return result
  }

  // Normaliza telefone
  const normalizePhone = (phone: string): string => {
    const digits = phone.replace(/\D/g, '')
    return (digits.length >= 10 && digits.length <= 13) ? digits : ''
  }

  // Enriquece com IA (Gemini)
  const handleEnrichWithAI = async () => {
    if (!geminiApiKey) {
      alert('Configure a API Key do Gemini nas configurações')
      return
    }
    
    setIsEnriching(true)
    try {
      const prompt = `
Analise os seguintes contatos extraídos do Google Maps e:
1. Corrija erros de formatação nos telefones (formato brasileiro: apenas dígitos, 10-11 dígitos)
2. Padronize as categorias
3. Extraia o email do website se possível
4. Retorne o JSON corrigido

Contatos:
${JSON.stringify(parsedContacts, null, 2)}

Retorne APENAS o JSON corrigido, sem explicações.
`
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.2, maxOutputTokens: 4096 },
          }),
        }
      )
      
      const data = await response.json()
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (jsonMatch) setParsedContacts(JSON.parse(jsonMatch[0]))
    } catch (e) {
      console.error('Erro ao enriquecer com IA:', e)
    } finally {
      setIsEnriching(false)
    }
  }

  // Importa contatos
  const handleImport = async () => {
    if (!selectedListId) {
      alert('Selecione uma lista')
      return
    }
    
    setStep('importing')
    try {
      const validContacts = parsedContacts.filter(c => c.phone && c.phone.length >= 10)
      await onImportContacts(validContacts, selectedListId)
      setPastedData('')
      setParsedContacts([])
      setStep('instructions')
    } catch (e) {
      console.error('Erro ao importar:', e)
      setStep('preview')
    }
  }

  // Remove contato do preview
  const handleRemoveContact = (id: string) => {
    setParsedContacts(prev => prev.filter(c => c.id !== id))
  }

  // Edita contato no preview
  const handleEditContact = (id: string, field: keyof ExtractedContact, value: string) => {
    setParsedContacts(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c))
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <MapPin className="w-6 h-6 text-violet-600" />
          Extração de Contatos
        </h1>
        <p className="text-slate-500 mt-1">
          Extraia contatos do Google Maps usando nossa extensão
        </p>
      </header>

      {/* Step: Instructions */}
      {step === 'instructions' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-violet-50 to-indigo-50 rounded-xl p-6 border border-violet-100">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">
              Como extrair contatos do Google Maps
            </h2>
            <ol className="space-y-4">
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-violet-600 text-white text-sm flex items-center justify-center">1</span>
                <div>
                  <p className="font-medium">Instale a extensão</p>
                  <p className="text-sm text-slate-500">Baixe "SendMessage Extractor" no navegador</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-violet-600 text-white text-sm flex items-center justify-center">2</span>
                <div>
                  <p className="font-medium">Pesquise no Google Maps</p>
                  <p className="text-sm text-slate-500">Ex: "Pizzarias em São Paulo"</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-violet-600 text-white text-sm flex items-center justify-center">3</span>
                <div>
                  <p className="font-medium">Extraia os contatos</p>
                  <p className="text-sm text-slate-500">Clique no ícone da extensão e "Extrair Todos"</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-violet-600 text-white text-sm flex items-center justify-center">4</span>
                <div>
                  <p className="font-medium">Copie e cole aqui</p>
                  <p className="text-sm text-slate-500">Clique "Copiar JSON" e cole no próximo passo</p>
                </div>
              </li>
            </ol>
          </div>
          <button onClick={() => setStep('paste')} className="w-full py-3 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700">
            Já tenho os dados, continuar →
          </button>
        </div>
      )}

      {/* Step: Paste */}
      {step === 'paste' && (
        <div className="space-y-4">
          <textarea
            value={pastedData}
            onChange={(e) => setPastedData(e.target.value)}
            placeholder='Cole aqui o JSON ou CSV...'
            className="w-full h-64 p-4 border rounded-lg font-mono text-sm"
          />
          {parseError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg">
              <AlertCircle className="w-5 h-5" />{parseError}
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={() => setStep('instructions')} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">← Voltar</button>
            <button onClick={handleParse} disabled={!pastedData.trim()} className="flex-1 py-3 bg-violet-600 text-white rounded-lg font-medium disabled:opacity-50">
              Processar dados →
            </button>
          </div>
        </div>
      )}

      {/* Step: Preview */}
      {step === 'preview' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{parsedContacts.length} contatos</h2>
            {geminiApiKey && (
              <button onClick={handleEnrichWithAI} disabled={isEnriching} className="flex items-center gap-2 px-4 py-2 bg-violet-500 text-white rounded-lg text-sm">
                <Sparkles className="w-4 h-4" />
                {isEnriching ? 'Processando...' : 'Enriquecer com IA'}
              </button>
            )}
          </div>
          
          <div className="border rounded-lg overflow-hidden max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                  <th className="text-left p-3">Nome</th>
                  <th className="text-left p-3">Telefone</th>
                  <th className="text-left p-3">Categoria</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {parsedContacts.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="p-3">
                      <input type="text" value={c.name} onChange={(e) => handleEditContact(c.id, 'name', e.target.value)} className="w-full bg-transparent border-0 p-0" />
                    </td>
                    <td className="p-3">
                      <input type="text" value={c.phone} onChange={(e) => handleEditContact(c.id, 'phone', e.target.value)} className={`w-full bg-transparent border-0 p-0 ${!c.phone || c.phone.length < 10 ? 'text-red-500' : ''}`} />
                    </td>
                    <td className="p-3 text-slate-500">{c.category || '-'}</td>
                    <td className="p-3">
                      <button onClick={() => handleRemoveContact(c.id)} className="text-red-500">×</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
            <label className="text-sm font-medium">Importar para:</label>
            <select value={selectedListId} onChange={(e) => setSelectedListId(e.target.value)} className="flex-1 px-3 py-2 border rounded-lg">
              <option value="">Selecione uma lista...</option>
              {lists.map((list) => <option key={list.id} value={list.id}>{list.name}</option>)}
            </select>
          </div>
          
          <div className="flex gap-3">
            <button onClick={() => setStep('paste')} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">← Voltar</button>
            <button onClick={handleImport} disabled={!selectedListId} className="flex-1 py-3 bg-green-600 text-white rounded-lg font-medium disabled:opacity-50">
              Importar {parsedContacts.filter(c => c.phone?.length >= 10).length} contatos →
            </button>
          </div>
        </div>
      )}

      {/* Step: Importing */}
      {step === 'importing' && (
        <div className="text-center py-12">
          <div className="w-16 h-16 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-lg font-medium">Importando contatos...</p>
        </div>
      )}
    </div>
  )
}
```

---

### PARTE 3: Integração no App.tsx

#### Adicionar import

```typescript
import ExtractionPage from './pages/ExtractionPage'
```

#### Adicionar item no menu (Sidebar)

```typescript
// No array de menuItems, adicionar:
{ id: 'extraction', label: 'Extração', icon: MapPin, permission: 'contacts.create' },
```

#### Adicionar rota no switch de páginas

```typescript
{currentPage === 'extraction' && (
  <ExtractionPage
    lists={lists}
    geminiApiKey={geminiApiKey} // Adicionar estado para API key do Gemini
    onImportContacts={async (contacts, listId) => {
      const newContacts = contacts.map(c => ({
        id: crypto.randomUUID(),
        name: c.name,
        phone: c.phone,
        email: c.email || '',
        address: c.address || '',
        category: c.category || '',
        rating: c.rating || '',
        website: c.website || '',
        listId,
      }))
      
      const { error } = await supabase
        .from('contacts')
        .insert(newContacts.map(c => ({
          user_id: currentUser.id,
          list_id: listId,
          name: c.name,
          phone: c.phone,
          email: c.email,
          address: c.address,
          category: c.category,
          rating: c.rating,
          notes: c.website ? `Website: ${c.website}` : '',
        })))
      
      if (error) throw error
      setContacts(prev => [...prev, ...newContacts])
    }}
  />
)}
```

#### Adicionar estado para API Key do Gemini

```typescript
// Junto com os outros estados
const [geminiApiKey, setGeminiApiKey] = useState<string>(() => {
  return localStorage.getItem('sendmessage_gemini_api_key') || ''
})

// Salvar quando mudar
useEffect(() => {
  if (geminiApiKey) {
    localStorage.setItem('sendmessage_gemini_api_key', geminiApiKey)
  }
}, [geminiApiKey])
```

#### Adicionar campo na SettingsPage para API Key

```typescript
// Na SettingsPage, adicionar input para API Key do Gemini
<div className="space-y-2">
  <label className="text-sm font-medium">API Key do Google Gemini (opcional)</label>
  <input
    type="password"
    value={geminiApiKey}
    onChange={(e) => onChangeGeminiApiKey(e.target.value)}
    placeholder="AIza..."
    className="w-full px-3 py-2 border rounded-lg"
  />
  <p className="text-xs text-slate-500">
    Usada para enriquecer contatos extraídos com IA. 
    <a href="https://aistudio.google.com/app/apikey" target="_blank" className="text-violet-600 hover:underline">
      Obter API Key gratuita
    </a>
  </p>
</div>
```

---

### PARTE 4: Publicação da Extensão

#### Opção A: Chrome Web Store (recomendado)
1. Criar conta de desenvolvedor ($5 taxa única)
2. Fazer upload do .zip da extensão
3. Aguardar revisão (1-3 dias)

#### Opção B: Instalação manual (desenvolvimento)
1. Compactar pasta da extensão em .zip
2. Hospedar em servidor ou GitHub Releases
3. Usuário baixa e instala via `chrome://extensions` > "Carregar sem compactação"

---

### Checklist de Implementação

- [ ] Criar pasta `sendmessage-extractor/` com arquivos da extensão
- [ ] Criar ícones 16x16, 48x48 e 128x128 para a extensão
- [ ] Criar `popup.css` com estilos do popup
- [ ] Testar extensão localmente no Chrome
- [ ] Criar `src/pages/ExtractionPage.tsx`
- [ ] Adicionar item "Extração" no menu da Sidebar
- [ ] Adicionar rota no App.tsx
- [ ] Adicionar estado `geminiApiKey` no App.tsx
- [ ] Adicionar campo de API Key na SettingsPage
- [ ] Testar fluxo completo: Maps → Extensão → Colar → Importar
- [ ] Publicar extensão (Chrome Web Store ou manual)

---

## ⚙️ DÉBITOS TÉCNICOS

- [ ] Extrair lógica do App.tsx para custom hooks (`useContacts`, `useCampaigns`, etc.)
- [ ] Migrar backend de JavaScript para TypeScript
- [ ] Configurar CI/CD (GitHub Actions)
- [ ] Criar documentação de API (Swagger/OpenAPI)
- [ ] Revisar todas as queries/inserts/deletes do Supabase para garantir uso consistente de `effectiveUserId` (modo "ver como") em vez de `currentUser.id` onde apropriado
- [ ] Adicionar banner global visível quando o modo "ver como usuário" estiver ativo (indicando usuário impersonado e impacto nas gravações)
- [ ] Refinar fluxo de impersonação para garantir que toda criação/edição/exclusão de campanhas, listas, contatos e históricos respeite o usuário efetivo
- [ ] Revisar e padronizar configuração de PWA/service worker para evitar servir bundles antigos em desenvolvimento (localhost vs túnel Cloudflare)

---

## ✅ Já concluídos

- [x] Duplicar campanha existente
- [x] Configurar intervalo de envio entre contatos
- [x] Intervalo de envio independente por campanha
- [x] Registrar resultado de disparo por campanha
- [x] Persistir página atual no localStorage
- [x] Remover botão "Pré-visualizar payload n8n"
- [x] Persistir histórico de envios no Supabase
- [x] Backup/restore inclui histórico de envios
- [x] Sistema de permissões e grupos (RBAC)
- [x] Página de gestão de usuários e grupos (AdminUsersPage)
- [x] Hook usePermissions() para verificar acesso
- [x] Verificação de permissões em páginas e botões
- [x] Modo debug com toggle na tela de configurações
- [x] Campo de nome no cadastro de usuário
- [x] Slider "Lembrar de mim" na autenticação
- [x] Exibir nome do usuário na Sidebar e card de debug
- [x] Botões de marcar/desmarcar todas as permissões
- [x] Restrição de hierarquia de papéis na atribuição de grupos
