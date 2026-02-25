# 🗺️ SendMessage Maps Extractor — Extensão Chrome

Extraia contatos de negócios diretamente do Google Maps, **100% gratuito**, sem APIs pagas.

---

## 📦 Instalação

### 1. Carregue a extensão no Chrome

1. Abra o Chrome e vá para `chrome://extensions/`
2. Ative o **Modo de desenvolvedor** (toggle no canto superior direito)
3. Clique em **"Carregar sem compactação"**
4. Selecione a pasta `extension/` deste projeto
5. A extensão aparecerá com o ícone 🗺️ na barra do Chrome

### 2. Configure o backend

1. Clique no ícone da extensão
2. Expanda **⚙️ Configurações**
3. Preencha:
   - **URL do Backend**: `https://clrodrigues-sendmessage-backend.rsybpi.easypanel.host`
   - **Token**: cole seu `auth_token` (obtido ao fazer login no SendMessage)
   - **ID da Lista**: o ID da lista onde os contatos serão importados

Para obter o token, abra o SendMessage no navegador, abra o DevTools (F12) → Console → digite:
```javascript
localStorage.getItem('auth_token')
```

Para obter o ID de uma lista, vá ao SendMessage → selecione a lista → veja na URL ou no DevTools.

---

## 🚀 Como usar

1. **Abra o Google Maps** → [maps.google.com](https://www.google.com/maps)
2. **Pesquise** por tipo de negócio + região:
   - Ex: `Pizzarias em Santo André, SP`
   - Ex: `Salões de beleza em Campinas`
   - Ex: `Clínicas odontológicas em Belo Horizonte, MG`
3. Aguarde os resultados carregarem na barra lateral
4. **Clique na extensão** (ícone 🗺️ na barra do Chrome)
5. Escolha o **modo de extração**:
   - ⚡ **Rápido**: nome, endereço, avaliação (sem telefone)
   - 📞 **Completo**: inclui telefone (~2 segundos por contato)
6. Clique em **"Extrair resultados"**
7. Revise os contatos extraídos
8. Clique em **"Importar para SendMessage"**

### Dica: Carregar mais resultados

O Google Maps mostra ~20 resultados por padrão. Para carregar mais:
- Clique em **"🔄 Rolar mais"** na extensão, ou
- Role manualmente a barra lateral do Maps para baixo
- Repita 2-3 vezes para carregar todos os resultados

---

## 🔍 O que é extraído

| Campo | Modo Rápido ⚡ | Modo Completo 📞 |
|---|---|---|
| Nome | ✅ | ✅ |
| Categoria | ✅ | ✅ |
| Endereço | ✅ | ✅ |
| Avaliação (★) | ✅ | ✅ |
| Telefone | ❌ | ✅ |
| Site | ❌ | ✅ |

---

## ⚠️ Observações importantes

- **Gratuito e ilimitado**: sem chaves de API, sem custos
- **Deduplicação**: contatos com o mesmo telefone já existentes no sistema são ignorados automaticamente
- **Velocidade**: extração rápida ~5s para 20 contatos; completa ~40s para 20 contatos
- **Seletores**: o Google Maps atualiza seu HTML periodicamente; se a extração parar de funcionar, abra uma issue

---

## 🏗️ Estrutura da Extensão

```
extension/
├── manifest.json          # Configuração da extensão (MV3)
├── popup/
│   ├── popup.html         # Interface do usuário
│   └── popup.js           # Lógica de extração e importação
├── content/
│   └── content.js         # Script injetado no Maps (badge visual)
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

---

## 🔧 Troubleshooting

**"Nenhum resultado encontrado"**
→ Certifique-se de ter feito uma busca no Maps antes de clicar na extensão

**Telefones não aparecem no modo completo**
→ O Google Maps mudou o HTML; tente o modo rápido e use a opção "Carregar telefones" dentro do SendMessage

**Erro ao importar**
→ Verifique se o token e URL do backend estão corretos nas configurações
