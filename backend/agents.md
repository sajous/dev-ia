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
    - Autenticação JWT e Autorização por Roles (implementado).
- **Tecnologias:** FastAPI, Pydantic, SQLModel, SQLAlchemy.

## Segurança / Autenticação
- **Componentes Chave:**
    - `app/core/config.py`: Configurações JWT (`SECRET_KEY_JWT`, `ALGORITHM_JWT`, `ACCESS_TOKEN_EXPIRE_MINUTES`) via variáveis de ambiente.
    - `app/core/security.py`: Funções de hash de senha (`get_password_hash`, `verify_password`), criação e decodificação de tokens JWT (`create_access_token`, `decode_token`). Usa `passlib[bcrypt]` e `python-jose[cryptography]`.
    - `app/api/auth.py`: Rota `POST /auth/login` — valida credenciais e retorna `access_token` Bearer.
    - `app/api/deps.py`: Dependências FastAPI `get_current_user` (decodifica token e busca usuário) e `has_role(required_roles)` (verifica se o usuário tem a role necessária, levanta 403 caso contrário).
- **Roles disponíveis:** `STOCK_STAFF`, `STOCK_MANAGER`, `SALES_STAFF`, `SALES_MANAGER`, `HR_MANAGER`.
- **Proteção de rotas de Produtos:**
    - `POST /products`: `STOCK_STAFF`, `STOCK_MANAGER`.
    - `GET /products`: qualquer usuário autenticado (view diferenciada por role).
    - `PATCH /products/{id}`: apenas `STOCK_MANAGER`.

## Data Agent
- **Responsabilidade:** Gerenciar a persistência e recuperação de dados para as entidades principais do sistema (Usuário, Produto). Interage diretamente com o banco de dados via ORM.
- **Tecnologias:** SQLModel, Alembic, SQLite.
- **Entidades Gerenciadas:** User (com `role`, `hashed_password`), Product (com `price_cost`, `quantity`, `min_stock_level`, `history`).
- **Operações:** CRUD básico (create, read, update, delete).

## Agente de Testes do Backend
- **Responsabilidade Principal:**
    - Execução e validação de testes unitários e de integração.
    - Geração de relatórios de cobertura de código.
- **Cobertura Atual:** 100% (71 testes).
- **Tecnologias:** Pytest, Pytest-cov.
- **Arquivos de Teste:** `tests/test_auth.py`, `tests/test_deps.py`, `tests/test_products.py`, `tests/test_models.py`, `tests/test_crud.py`, `tests/test_database.py`, `test_main.py`.
