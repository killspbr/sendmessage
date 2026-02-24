# Plano de Modularização: App.tsx

## 1. Objetivo
O arquivo principal `frontend/src/App.tsx` possui atualmente mais de 3700 linhas. Isso compromete seriamente a manutenibilidade, a facilidade de navegação e a colaboração no projeto. O objetivo deste plano é identificar componentes acoplados (como o Modal global, botões flutuantes, regras de negócio isoladas localmente) e lógicas de estado e refatorá-las em módulos e subcomponentes dedicados, utilizando boas práticas de arquitetura frontend.

## 2. Escopo da Fase 1: Identificação e Extração
- **Criação de Contextos/Providers (`frontend/src/contexts/`)**:
  - `SettingsContext.tsx` ou similar para manter os dados do `userSettings` e `globalSettings`.
  - Extrair o hook massivo de estado principal (`App.tsx` possui estados para modais, chaves de API, instâncias de evolution).
- **Extração de Componentes (`frontend/src/components/`)**:
  - Componentes de Sidebar / Navegação (já há algo em App.tsx que dita como o menu é desenhado).
  - Componentes Modais que são criados localmente (ex: `AddContactModal`, `NewCampaignModal`, `SettingsModal` - caso ainda estejam inline no App).
- **Extração de Hooks Personalizados (`frontend/src/hooks/`)**:
  - Refatorar lógicas de uso da Gemini AI para um `useGeminiAI.ts`.
  - Mover lógica central de envio e orquestração de campanha para `useCampaignRunner.ts` ou algo equivalente, se ainda residir em App.tsx.
- **Limpeza do `App.tsx`**:
  - `App.tsx` ficará responsável **estritamente pelo roteamento global (Switch/Router layout)**, provedores de contexto, e montagem visual primária (Layout Skeleton).

## 3. Fases de Implementação (Orquestração Fase 2)
### Grupo 1: Levantamento Estrutural e Contextos
- **Agente Responsável**: `project-planner` / `frontend-specialist`
- Analisar quais hooks podem ser levados de `App.tsx` em segurança para `frontend/src/hooks/` sem quebrar ciclos de renderização.
- Criar a camada global do(s) contexto(s).

### Grupo 2: Modularização de UI e Serviços
- **Agente Responsável**: `frontend-specialist`
- Fatiar a interface JSX do `App.tsx` extraindo Componentes como `AppSidebar`, `TopBar` e separando modais, convertendo a montagem do "return" final num arquivo JSX limpo e direto.
- Separar o serviço da LMM (Gemini AI text generator) que está "preso" hoje dentro de `callGeminiForCampaign` no `App.tsx`.

### Grupo 3: Validação de Qualidade Otimizada
- **Agente Responsável**: `test-engineer` / `performance-optimizer`
- Avaliar re-renderizações desnecessárias. A quebra em contextos deve observar se um update numa variável de perfil não re-renderiza à toa uma página de contatos.
- Rodar o lint (`npm run lint`), checar os imports cruzados.
- Testar a aplicação (`npm run build`).

---
**Observação**: Esse trabalho exigirá uma forte reorganização de imports ao redor de praticamente todas as `pages` do sistema (pois muitas recebiam os props em cascata que vinham originados no `App.tsx` injetado como drill down).
