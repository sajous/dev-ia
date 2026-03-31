# Agentes do Projeto

Este documento descreve os agentes de alto nível e suas responsabilidades dentro da arquitetura geral do projeto.

## Arquiteto Líder
- **Responsabilidade Principal:** Definição da arquitetura, geração de ordens técnicas, revisão de código e garantia de conformidade com as diretrizes do CLAUDE.md.
- **Interage com:** Claude Code, Frontend Agent, Backend Agent.

## Claude Code
- **Responsabilidade Principal:** Execução de ordens técnicas detalhadas, implementação de funcionalidades, escrita de testes, gerenciamento de dependências e interação com o sistema de controle de versão (Git).
- **Capacidades:**
  - Desenvolvimento Frontend (React, TypeScript, Tailwind CSS)
  - Desenvolvimento Backend (FastAPI, Python, SQLite)
  - Implementação de Testes (100% de cobertura)
  - Refatoração de Código
  - **Documentação**
- **Interage com:** Arquiteto Líder, Backend Agent, Frontend Agent.

## Backend Agent
- **Responsabilidade Principal:** Desenvolvimento e manutenção da API, lógica de negócios, integração com banco de dados e serviços externos.
- **Tecnologias:** Python, FastAPI, SQLAlchemy (futuro).
- **Interage com:** Claude Code, Frontend Agent (via API).

## Frontend Agent
- **Responsabilidade Principal:** Desenvolvimento da interface do usuário (UI), experiência do usuário (UX), consumo de APIs do backend e gerenciamento de estado da aplicação.
- **Tecnologias:** React, TypeScript, Vite.
- **Interage com:** Claude Code, Backend Agent (via API).

## Agente de Qualidade/Testes
- **Responsabilidade Principal:** Garantir a cobertura e qualidade dos testes, automação de testes unitários, de integração e end-to-end.
- **Interage com:** Claude Code, Backend Agent, Frontend Agent.

**Nota:** As responsabilidades específicas de cada camada (backend/frontend) são detalhadas em seus respectivos arquivos `agents.md`.

## Entregas Recentes

- **Módulo de Gestão de RH (2026-03-30)**
  - Role `OWNER` adicionada ao enum de roles
  - Script `seed_admin.py` com hashing bcrypt e logger
  - CRUD completo `/users` com RBAC (OWNER, HR_MANAGER, ADMIN)
  - Proteção: não deletar próprio usuário, não deletar último admin
  - Página `HRManagementPage` com tabela paginada e formulário de contratação
  - Rota `/hr-management` protegida por role no frontend
  - 100% coverage em backend (121 testes) e frontend (76 testes)
