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
    - Definição da estrutura de dados e modelos (futuro).
    - Implementação da lógica de negócios central.
    - Gerenciamento de persistência de dados (futuro).
    - Autenticação e Autorização (futuro).
- **Tecnologias:** FastAPI, Pydantic, SQLAlchemy (futuro).

## Agente de Testes do Backend
- **Responsabilidade Principal:**
    - Execução e validação de testes unitários e de integração.
    - Geração de relatórios de cobertura de código.
- **Tecnologias:** Pytest, Pytest-cov.
