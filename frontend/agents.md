# Agentes do Frontend

Este documento detalha os agentes e suas responsabilidades específicas dentro da camada de frontend.

## Claude Code (Ao Atuar no Frontend)
- **Responsabilidade Principal:**
    - Inicializar e configurar projetos React com TypeScript via Vite.
    - Gerenciar dependências JavaScript/TypeScript (npm).
    - Implementar componentes de UI/UX.
    - Consumir APIs do backend.
    - Escrever testes para componentes e lógicas do frontend.
- **Interage com:** Arquiteto Líder (recebe ordens), Backend Agent (via API).

## Frontend Core
- **Responsabilidade Principal:**
    - Definição da arquitetura de componentes.
    - Gerenciamento de estado de autenticação via `AuthContext`.
    - Roteamento da interface do usuário com `react-router-dom`.
    - Interação com APIs do backend.
- **Tecnologias:** React 19, TypeScript, Vite, React Router DOM.

## Autenticação / Contexto
- **Componentes Chave:**
    - `src/context/AuthContext.tsx`: React Context que gerencia o estado de autenticação global. Fornece `isAuthenticated`, `token`, `user` (email, role), `login(email, password)` e `logout()`. Estado persistido em `localStorage`.
    - `src/pages/LoginPage.tsx`: Formulário de login com validação de campos (obrigatórios e formato de e-mail). Faz `POST /auth/login`, armazena token e redireciona para `/dashboard`.
    - `src/pages/DashboardPage.tsx`: Rota protegida `/dashboard`. Redireciona para `/login` se não autenticado. Exibe boas-vindas com email e role do usuário. Oferece botão de logout.
    - `src/App.tsx`: Configura `BrowserRouter`, `AuthProvider` e `Routes` para `/login`, `/dashboard` e rota catch-all.

## Agente de Testes do Frontend
- **Responsabilidade Principal:**
    - Execução e validação de testes de componentes e integração no frontend.
    - Geração de relatórios de cobertura de código.
- **Cobertura Atual:** 100% (19 testes).
- **Tecnologias:** Vitest, React Testing Library, jsdom.
- **Arquivos de Teste:** `src/tests/App.test.tsx`, `src/tests/AuthContext.test.tsx`, `src/tests/LoginPage.test.tsx`, `src/tests/DashboardPage.test.tsx`.
