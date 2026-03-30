from fastapi import FastAPI
from database import create_db_and_tables
from app.api.auth import router as auth_router
from app.api.products import router as products_router

aplicacao = FastAPI()


@aplicacao.on_event("startup")
def on_startup():
    create_db_and_tables()


@aplicacao.get("/health")
def verificar_saude():
    return {"status": "online"}


aplicacao.include_router(auth_router)
aplicacao.include_router(products_router)
