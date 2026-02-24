# Plano de Refatoração: IA e Dados da Empresa

## 1. Objetivo
Melhorar a geração de conteúdo usando IA (Gemini) permitindo que o usuário informe dados específicos da sua própria empresa (ex: nome, segmento, diferenciais, tom de voz) para que o conteúdo gerado seja mais personalizado e alinhado com o perfil do negócio.

## 2. Escopo
- **Backend (`backend/src/index.js`)**: 
  - Adicionar um novo campo `company_info` (texto) na tabela `user_profiles`.
  - Atualizar os endpoints `GET /api/profile`, `POST /api/profile` e `PUT /api/profile` para suportar o recebimento e retorno do `company_info`.
- **Frontend (`frontend/src/App.tsx`, `frontend/src/pages/UserSettingsPage.tsx`, etc.)**:
  - Atualizar o tipo `UserSettings` para incluir `company_info`.
  - Na página de "Meu perfil" (`UserSettingsPage`), adicionar um campo de texto (`textarea`) para que o usuário informe os dados da sua empresa (ex: "Somos uma padaria focada em pães artesanais...").
  - Na função de geração de prompt do Gemini (`callGeminiForCampaign` no `App.tsx`), incluir as instruções do `company_info` (caso exista) como contexto adicional no `prompt` fornecido à IA.
- **Prompt da IA**:
  - Modificar o template de sugestão e reescrita para considerar o contexto fornecido pelo usuário, como por exemplo:
    `Contexto sobre a empresa remetente: [company_info]`

## 3. Fases de Implementação (Orquestração Fase 2)
### Grupo 1 (Database & Backend API)
- **Agente Responsável**: `database-architect` / `backend-specialist`
- Adicionar o campo na base (usando migration ou script de alteração na tabela `user_profiles`).
- Alterar as queries SQL (`INSERT INTO user_profiles` e `UPDATE user_profiles`) para inserir ou atualizar o campo `company_info`.

### Grupo 2 (Frontend UI & Integração)
- **Agente Responsável**: `frontend-specialist`
- Inserir campo `<textarea>` na `UserSettingsPage.tsx` e gerenciar estado no App.tsx.
- Modificar o "prompt" enviado para a IA (`callGeminiForCampaign`) para incluir o texto de `company_info`.

### Grupo 3 (Testes)
- **Agente Responsável**: `test-engineer`
- Validar se o perfil do usuário salva a nova coluna sem quebrar os endpoints atuais.
- Avaliar os prompts sendo enviados para a API do Gemini via depuração de log ou testes locais.

---
**Observação**: Esse trabalho exigirá uma modificação de DDL na tabela. Se a tabela foi criada manual, deverá ser executado um `ALTER TABLE user_profiles ADD COLUMN company_info TEXT;`.
