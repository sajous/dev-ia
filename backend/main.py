from fastapi import FastAPI

aplicacao = FastAPI()

@aplicacao.get("/health")
def verificar_saude():
    return {"status": "online"}
