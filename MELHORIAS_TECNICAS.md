# Documento Técnico de Melhorias - CL Marketing

**Data:** Dezembro 2025 | **Versão:** 1.0

---

## 1. SISTEMA DE GESTÃO DE USUÁRIOS E PERMISSÕES (CRÍTICO)

### 1.1 Novas Tabelas Supabase

```sql
-- Grupos de usuários
CREATE TABLE user_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Permissões do sistema
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  module TEXT NOT NULL
);

-- Relacionamento grupo <-> permissões
CREATE TABLE group_permissions (
  group_id UUID REFERENCES user_groups(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (group_id, permission_id)
);

-- Perfil do usuário
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id UUID REFERENCES user_groups(id),
  full_name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Log de auditoria
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 1.2 Permissões Sugeridas

| Código | Módulo |
|--------|--------|
| `dashboard.view` | dashboard |
| `contacts.view/create/edit/delete/import/export` | contacts |
| `campaigns.view/create/edit/delete/send` | campaigns |
| `settings.view/edit` | settings |
| `admin.users/groups/audit` | admin |
| `backup.export/import` | backup |

### 1.3 Grupos Padrão

- **Administrador**: Todas as permissões
- **Gerente**: Tudo exceto admin.*
- **Operador**: contacts.*, campaigns básico
- **Visualizador**: Apenas *.view

### 1.4 Nova Página Admin

```
src/pages/admin/
├── UsersPage.tsx
├── GroupsPage.tsx
├── PermissionsPage.tsx
└── AuditLogPage.tsx
```

---

## 2. SUBSTITUIR ALERTAS NATIVOS (CRÍTICO)

**Problema:** `window.alert()`, `window.confirm()`, `window.prompt()` quebram UX.

### 2.1 Componentes Necessários

```
src/components/ui/
├── Modal.tsx
├── AlertModal.tsx
├── ConfirmModal.tsx
├── PromptModal.tsx
└── Toast.tsx
```

### 2.2 Locais para Alterar

- `handleCreateList` → prompt
- `handleRenameCurrentList` → prompt
- `handleDeleteCurrentList` → confirm
- `handleDeleteCampaign` → confirm
- `handleDeleteContact` → confirm

---

## 3. AGENDAMENTO DE CAMPANHAS

```sql
ALTER TABLE campaigns ADD COLUMN scheduled_at TIMESTAMPTZ;
ALTER TABLE campaigns ADD COLUMN timezone TEXT DEFAULT 'America/Sao_Paulo';
```

**Backend:** Usar node-cron ou Supabase Edge Functions para verificar e disparar.

---

## 4. GERAÇÃO DE CONTEÚDO COM IA

```typescript
// POST /api/ai/generate-campaign-content
{
  prompt: string,
  tone: 'formal' | 'casual' | 'promotional',
  channel: 'whatsapp' | 'email'
}
```

**UI:** Botão "Gerar com IA" no editor de campanha.

---

## 5. TEMPLATES DE CAMPANHA

```sql
CREATE TABLE campaign_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  channel TEXT NOT NULL,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 6. MELHORIAS DE PERFORMANCE

| Melhoria | Solução |
|----------|---------|
| Paginação | Supabase `.range()` server-side |
| Virtualização | react-virtual para listas grandes |
| Code Splitting | `lazy()` para páginas |
| Cache | TanStack Query (React Query) |

---

## 7. SEGURANÇA

- **Rate Limiting**: express-rate-limit no backend
- **Validação**: Zod para schemas
- **Sanitização**: DOMPurify para HTML
- **Auditoria**: Log de ações sensíveis

---

## 8. NOVAS FUNCIONALIDADES

| Funcionalidade | Descrição |
|----------------|-----------|
| Relatórios PDF/Excel | Exportar métricas |
| Integração CRM | HubSpot, Pipedrive, RD Station |
| API Pública | REST API com API Keys |
| Webhooks de Saída | Notificar sistemas externos |
| A/B Testing | Testar variações de campanha |
| Blacklist/Opt-out | Gerenciar contatos bloqueados |
| Lixeira | Soft delete com recuperação |
| Tema Escuro | Dark mode |
| i18n | Múltiplos idiomas |

---

## 9. DÉBITOS TÉCNICOS

| Débito | Solução |
|--------|---------|
| App.tsx grande (112KB) | Extrair para custom hooks |
| Backend JS puro | Migrar para TypeScript |
| Sem testes | Vitest + Testing Library + Playwright |
| Sem CI/CD | GitHub Actions |

---

## 10. PRIORIZAÇÃO

### Fase 1 (2-3 semanas)
- Sistema de permissões
- Substituir alertas nativos

### Fase 2 (3-4 semanas)
- Agendamento de campanhas
- IA para conteúdo
- Templates

### Fase 3 (2-3 semanas)
- Performance (paginação, cache)
- Dashboard avançado

### Fase 4 (Contínuo)
- API pública
- Integrações
- Extras

---

**Esforço Total Estimado:** 295-450 horas
