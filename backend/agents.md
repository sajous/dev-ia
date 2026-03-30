# Agentes do Backend

Este documento detalha os agentes e suas responsabilidades específicas dentro da camada de backend.

## Claude Code (Ao Atuar no Backend)
- **Responsabilidade Principal:**
    - Implementar APIs RESTful e lógica de negócios.
    - Gerenciar dependências Python (venv, pip).
    - Escrever testes unitários e de integração para todas as funcionalidades.
    - Garantir 100% de cobertura de testes.
    - Manter código limpo e sem comentários, usando nomes semânticos.
    - Configurar e manter o ambiente virtual.
- **Interage com:** Arquiteto Líder (recebe ordens), Frontend Agent (via API).

## Backend Core
- **Responsabilidade Principal:**
    - Definição da estrutura de dados e modelos.
    - Implementação da lógica de negócios central.
    - Gerenciamento de persistência de dados.
    - Autenticação e Autorização (futuro).
- **Tecnologias:** FastAPI, Pydantic, SQLModel, SQLAlchemy.

## Data Agent
- **Responsabilidade:** Gerenciar a persistência e recuperação de dados para as entidades principais do sistema (Usuário, Produto). Interage diretamente com o banco de dados via ORM.
- **Tecnologias:** SQLModel, Alembic, SQLite.
- **Entidades Gerenciadas:** User, Product.
- **Operações:** CRUD básico (create, read, update, delete).

## Agente de Testes do Backend
- **Responsabilidade Principal:**
    - Execução e validação de testes unitários e de integração.
    - Geração de relatórios de cobertura de código.
- **Tecnologias:** Pytest, Pytest-cov.
