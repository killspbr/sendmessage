# Plano de Auditoria e Melhoria UX/Usabilidade: SendMessage

## 1. Objetivo
Transformar a experiência do usuário do SendMessage, focando em **Consistência Visual (Emerald/Logo)**, **Simplificação de Fluxos** e **Novas Funcionalidades de Retenção (Onboarding/Password Reset)**.

## 2. Agentes e Responsabilidades

| Agente | Foco de Trabalho |
| :--- | :--- |
| `explorer-agent` | Mapear referências de cores e limpar rotas obsoletas. |
| `frontend-specialist` | Implementar Onboarding, nova paleta Emerald e refatorar Sidebar/Dashboard. |
| `product-manager` | Redesenhar o fluxo de cadastro de contatos e organizar o menu de campanhas. |
| `backend-specialist` | Implementar a lógica de recuperação/redefinição de senha. |
| `security-auditor` | Revisar a segurança do fluxo de redefinição de senha. |

## 3. Tarefas Prioritárias

### A. Identidade Visual (Emerald Theme)
- [ ] Alterar o tema dominante de Violeta/Roxo para **Emerald/Verde**, refletindo as cores do logo.
- [ ] Atualizar `index.css` e componentes que usam classes `text-violet-*` ou `bg-violet-*`.

### B. Simplificação e Menu
- [ ] **Remover "Extrair"**: Excluir `ExtractPage.tsx`, rotas e itens de menu. A extração agora é via extensão.
- [ ] **Ajustar Menu Campanhas**: Resolver a confusão entre o título do menu e o sub-item "Campanhas". Proposta: Renomear ou agrupar melhor.

### C. Dashboard & Onboarding
- [ ] Implementar um componente de **Onboarding** na tela inicial para guiar novos usuários.
- [ ] Garantir que o Dashboard seja a porta de entrada com KPIS claros.

### D. Cadastro de Contatos
- [ ] Melhorar o UX de criação de contatos e listas, tornando o processo mais rápido e fluido.

### E. Recuperação de Senha
- [ ] Criar fluxo completo: Tela de "Esqueci minha senha", backend para geração de token/email e tela de redefinição.

## 4. Próximos Passos Imediatos
1. `explorer-agent`: Listar todas as ocorrências de `violet` no código para substituição.
2. `frontend-specialist`: Remover a página de Extração.
3. `backend-specialist`: Preparar o endpoint de Password Reset.

