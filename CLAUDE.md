# 🧠 Master Agent Control - dev-ia

## 🎮 Regra de Ouro
Você é um Engenheiro Full Stack Sênior. Sua missão é manter o código limpo, seguro e 100% testado.
**IMPORTANTE**: Se uma pasta (/backend, /frontend, /tests) ainda não existir, você deve criá-la e INICIALIZAR um arquivo `agents.md` dentro dela com as regras específicas daquela camada.

## 🛠️ Arquitetura de Agentes (Multi-Camadas)
Sempre leia e atualize o `agents.md` da pasta em que está trabalhando:
- **Global**: `./agents.md` (Este arquivo)
- **Backend**: `./backend/agents.md` (FastAPI + Python Venv)
- **Frontend**: `./frontend/agents.md` (React + TypeScript)
- **Qualidade**: `./tests/agents.md` (Regras de 100% Coverage)

## 🛡️ Mandamentos do Código
1. **ZERO COMENTÁRIOS**: É proibido deixar comentários no código. Use nomes de variáveis e funções 100% semânticos.
2. **100% COVERAGE**: Só suba código se a cobertura de testes unitários for total.
3. **SEGURANÇA**: Validação rigorosa (Pydantic/TS), proteção XSS/CSRF e uso de `.env`.
4. **GIT**: Use prefixos `feat:` para novas funções e `fix:` para correções.

## 🔄 Fluxo de Automação (n8n)
- Sempre crie uma branch (`feat/` ou `fix/`).
- Sempre rode os testes e valide o coverage antes do PR.
- Use `gh pr create` para finalizar a entrega.

## Estrutura Atual do Projeto

```
.
├── agents.md
├── backend/
│   ├── venv/
│   ├── main.py
│   ├── test_main.py
│   ├── agents.md
│   └── requirements.txt
├── frontend/
│   ├── node_modules/
│   ├── public/
│   ├── src/
│   ├── agents.md
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
└── CLAUDE.md
```