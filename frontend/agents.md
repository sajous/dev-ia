# Agentes do Frontend

Este documento detalha os agentes e suas responsabilidades específicas dentro da camada de frontend.

## Claude Code (Ao Atuar no Frontend)
- **Responsabilidade Principal:**
    - Inicializar e configurar projetos React com TypeScript via Vite.
    - Gerenciar dependências JavaScript/TypeScript (npm/yarn).
    - Implementar componentes de UI/UX.
    - Consumir APIs do backend.
    - Escrever testes para componentes e lógicas do frontend (futuro).
- **Interage com:** Arquiteto Líder (recebe ordens), Backend Agent (via API).

## Frontend Core
- **Responsabilidade Principal:**
    - Definição da arquitetura de componentes.
    - Gerenciamento de estado da aplicação.
    - Roteamento da interface do usuário.
    - Interação com APIs do backend.
- **Tecnologias:** React, TypeScript, Vite, React Router (futuro), Zustand/Redux (futuro).

## Agente de Testes do Frontend
- **Responsabilidade Principal:**
    - Execução e validação de testes de componentes e integração no frontend.
    - Geração de relatórios de cobertura de código.
- **Tecnologias:** Vitest (futuro), React Testing Library (futuro), Playwright/Cypress (futuro).
