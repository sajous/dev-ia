from fastapi.testclient import TestClient
from main import aplicacao

cliente = TestClient(aplicacao)

def test_verificar_saude():
    resposta = cliente.get("/health")
    assert resposta.status_code == 200
    assert resposta.json() == {"status": "online"}
