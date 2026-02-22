# Guia de Deploy - SendMessage

## 📦 Arquivos Prontos para Deploy

### Frontend
- **Pasta:** `frontend/dist/`
- **Build:** ✅ Concluído
- **Arquivos:** Todos os assets estáticos prontos para servir

### Backend
- **Pasta:** `backend/`
- **Arquivo principal:** `src/index.js`
- **Configuração:** `.env.production`

## 🚀 Instruções de Deploy

### 1. Frontend (Arquivos Estáticos)

**Opção A: Servidor Web (Nginx/Apache)**
```bash
# Copie o conteúdo de frontend/dist/ para o diretório do servidor
cp -r frontend/dist/* /var/www/html/
```

**Opção B: Cloudflare Pages / Netlify / Vercel**
- Faça upload da pasta `frontend/dist/`
- Configure o domínio

**Opção C: Túnel Cloudflare (Atual)**
- Frontend já está rodando na porta 5174
- Backend na porta 4000
- Túnel deve apontar para essas portas

### 2. Backend (Node.js)

**No servidor de produção:**

```bash
# 1. Copie a pasta backend/ para o servidor
scp -r backend/ usuario@servidor:/caminho/destino/

# 2. No servidor, instale dependências
cd /caminho/destino/backend
npm install --production

# 3. Configure variáveis de ambiente
# Edite o arquivo .env ou use .env.production
nano .env

# Altere BACKEND_PUBLIC_URL para a URL pública do seu servidor
BACKEND_PUBLIC_URL=https://seu-dominio.com

# 4. Inicie o servidor (use PM2 para produção)
npm install -g pm2
pm2 start src/index.js --name sendmessage-backend
pm2 save
pm2 startup
```

### 3. Variáveis de Ambiente Necessárias

**Backend (.env):**
```env
SUPABASE_URL=https://dpcytldfanmemiexomvk.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
BACKEND_PUBLIC_URL=https://seu-dominio.com
WEBHOOK_WHATSAPP=https://automacao-n8n.rsybpi.easypanel.host/webhook/disparocampanhazap
WEBHOOK_EMAIL=https://seu-n8n.com/webhook/disparo-email
PORT=4000
```

**Frontend (.env):**
```env
VITE_SUPABASE_URL=https://dpcytldfanmemiexomvk.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## ⚠️ Problema Identificado: Encoding de Caracteres

**Sintoma:** Caracteres estranhos aparecem nos textos (Ã§, Ã£o, Ã©, etc.)

**Causa:** O arquivo `frontend/src/App.tsx` está com encoding incorreto (ISO-8859-1 ao invés de UTF-8)

**Solução:**
1. Abra o arquivo `App.tsx` no VS Code
2. No canto inferior direito, clique em "UTF-8"
3. Selecione "Reopen with Encoding" → "Western (ISO 8859-1)"
4. Depois, clique novamente e selecione "Save with Encoding" → "UTF-8"
5. Faça um novo build: `npm run build`

**Alternativa (PowerShell):**
```powershell
# Converter arquivo para UTF-8
$content = Get-Content "frontend\src\App.tsx" -Raw -Encoding Default
$content = $content -replace 'Ã§Ã£o', 'ção' -replace 'Ã©', 'é' -replace 'Ã¡', 'á' -replace 'Ã³', 'ó'
[System.IO.File]::WriteAllText("frontend\src\App.tsx", $content, [System.Text.Encoding]::UTF8)
```

## 🔧 Configuração do Túnel Cloudflare

Se estiver usando túnel Cloudflare:

```bash
# Certifique-se de que os servidores estão rodando
cd backend
node src/index.js  # Porta 4000

cd ../frontend
npm run dev  # Porta 5174
```

Configure o túnel para apontar para:
- Frontend: `localhost:5174`
- Backend: `localhost:4000`

## ✅ Checklist de Deploy

- [ ] Build do frontend concluído (`npm run build`)
- [ ] Variáveis de ambiente configuradas no backend
- [ ] BACKEND_PUBLIC_URL atualizada para URL de produção
- [ ] Webhook do N8N configurado corretamente
- [ ] Backend rodando e acessível
- [ ] Frontend servindo arquivos estáticos
- [ ] Teste de envio de mensagem funcionando
- [ ] Problema de encoding corrigido (opcional)

## 📝 Notas Importantes

1. **Webhook atualizado:** O sistema agora usa `https://automacao-n8n.rsybpi.easypanel.host/webhook/disparocampanhazap`
2. **URL dinâmica:** O frontend detecta automaticamente a URL do backend baseado no hostname
3. **HTTPS em produção:** Certifique-se de usar HTTPS para evitar problemas de Mixed Content
4. **PM2 recomendado:** Use PM2 para gerenciar o processo do backend em produção

## 🆘 Troubleshooting

**Erro: "Nenhum webhook configurado"**
- Verifique se WEBHOOK_WHATSAPP está definido no .env do backend

**Erro: "Cannot connect to backend"**
- Verifique se BACKEND_PUBLIC_URL está correto
- Certifique-se de que o backend está rodando

**Caracteres estranhos nos textos**
- Siga as instruções de correção de encoding acima
- Faça rebuild do frontend após corrigir
