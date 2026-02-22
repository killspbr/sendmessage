# Debug de Webhooks - Guia de Teste

## Problema Atual
Admin consegue disparar campanhas, mas usuário não consegue mesmo com webhook configurado pelo admin.

## Logs de Debug Adicionados

Adicionei logs detalhados no backend (`backend/src/index.js` linhas 143-165) que mostrarão:
- User ID da campanha
- Perfil do usuário carregado
- Webhooks do perfil (WhatsApp e Email)
- Webhooks das variáveis de ambiente
- Webhooks finais escolhidos
- Canais da campanha
- Canais efetivos após filtro

## Como Testar

### 1. Reinicie o Backend
```bash
cd backend
# Mate o processo atual se estiver rodando
taskkill /F /PID <PID_DO_PROCESSO>

# Inicie novamente
node src/index.js
```

### 2. Configure Webhook para o Usuário
1. Acesse como admin
2. Vá em "Usuários e grupos"
3. Encontre o usuário que está tendo problema
4. Clique em "Editar webhooks"
5. Cole o webhook: `https://automacao-n8n.rsybpi.easypanel.host/webhook/disparocampanhazap`
6. Clique em "Salvar"

### 3. Teste com o Usuário
1. Faça logout
2. Faça login com o usuário
3. Tente disparar uma campanha
4. Observe os logs no terminal do backend

### 4. Analise os Logs

Os logs mostrarão algo como:
```
[DEBUG] User ID: abc123-def456
[DEBUG] User Profile: { webhook_whatsapp_url: '...', webhook_email_url: null }
[DEBUG] Webhook WhatsApp do perfil: https://automacao-n8n...
[DEBUG] Webhook Email do perfil: null
[DEBUG] Webhook WhatsApp env: https://automacao-n8n...
[DEBUG] Webhook Email env: https://seu-n8n.com/webhook/disparo-email
[DEBUG] Webhook WhatsApp final: https://automacao-n8n...
[DEBUG] Webhook Email final: https://seu-n8n.com/webhook/disparo-email
[DEBUG] Canais da campanha: ['whatsapp']
[DEBUG] Canais efetivos: ['whatsapp']
```

## Possíveis Problemas

### Problema 1: Webhook não está sendo salvo
**Sintoma:** `[DEBUG] Webhook WhatsApp do perfil: null`
**Solução:** Verifique se o webhook foi salvo corretamente no Supabase

### Problema 2: User ID diferente
**Sintoma:** User ID nos logs é diferente do esperado
**Solução:** Pode estar usando impersonação ou usuário errado

### Problema 3: Canais efetivos vazio
**Sintoma:** `[DEBUG] Canais efetivos: []`
**Solução:** Webhook está vazio ou canal não corresponde ao webhook disponível

### Problema 4: Frontend não recarregou
**Sintoma:** Mudanças não aparecem
**Solução:** 
```bash
cd frontend
npm run build
# ou
npm run dev
```

## Verificação no Supabase

Execute esta query no Supabase SQL Editor para verificar os webhooks:

```sql
SELECT 
  id,
  display_name,
  webhook_whatsapp_url,
  webhook_email_url
FROM user_profiles
WHERE id = 'USER_ID_AQUI';
```

## Próximos Passos

1. Reinicie o backend
2. Configure webhook para o usuário
3. Teste disparo
4. **Copie os logs completos** que aparecerem no terminal
5. Analise os logs para identificar onde está falhando

## Contato

Se após seguir estes passos o problema persistir, forneça:
- Logs completos do backend
- User ID do usuário com problema
- Screenshot da configuração de webhook no admin
- Mensagem de erro exata que aparece para o usuário
