# Sistema ERP de Mercado (IA-Driven)

Um sistema completo de gestão de estoque, vendas e recursos humanos, impulsionado por inteligência artificial.

## 🧠 Arquitetura de Agentes

Este projeto utiliza uma arquitetura de agentes para otimizar o desenvolvimento e a gestão:
- **Gemini (Arquiteto Líder):** Responsável por definir a visão geral, requisitos, regras de negócios e gerar ordens técnicas detalhadas.
- **Claude Code (Engenheiro):** Implementa as funcionalidades de acordo com as ordens técnicas, garantindo qualidade, testes e aderência às regras de codificação.

## 🚀 Stack Técnica

- **Backend:** FastAPI (Python)
- **Frontend:** React (TypeScript)
- **Banco de Dados:** SQLite
- **Estilização:** Tailwind CSS

## ⚙️ Como Rodar o Projeto

### Backend (Python)

1.  Navegue até o diretório `backend`:
    ```bash
    cd backend
    ```
2.  Crie e ative um ambiente virtual:
    ```bash
    python -m venv venv
    source venv/bin/activate # Linux/macOS
    # venv\Scripts\activate # Windows
    ```
3.  Instale as dependências:
    ```bash
    pip install -r requirements.txt
    ```
4.  Inicie o servidor FastAPI:
    ```bash
    uvicorn app.main:app --reload
    ```
    O backend estará disponível em `http://127.0.0.1:8000`.

### Frontend (React/TypeScript)

1.  Navegue até o diretório `frontend`:
    ```bash
    cd frontend
    ```
2.  Instale as dependências:
    ```bash
    npm install
    ```
3.  Inicie o servidor de desenvolvimento:
    ```bash
    npm run dev
    ```
    O frontend estará disponível em `http://localhost:5173` (ou porta similar).

## 🗺️ Roadmap do Projeto

- [x] **Módulo de Estoque:**
    - [x] Visualização de Dashboard de Estoque
    - [ ] Cadastro de Produtos (Formulário e API)
    - [ ] Edição e Exclusão de Produtos
    - [ ] Relatórios de Inventário
- [ ] **Módulo de Vendas:**
    - [ ] Registro de Pedidos
    - [ ] Gestão de Clientes
    - [ ] Processamento de Pagamentos
- [x] **Módulo de RH:**
    - [x] Admin de Usuários (Visualização)
    - [ ] Cadastro de Funcionários
    - [ ] Gestão de Folha de Pagamento
    - [ ] Controle de Acesso e Permissões Avançado
