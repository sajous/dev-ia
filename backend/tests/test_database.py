from sqlmodel import SQLModel, Session, create_engine
from sqlmodel.pool import StaticPool
from database import create_db_and_tables, get_session, engine


def test_create_db_and_tables():
    test_engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    original_engine = __import__("database").engine
    import database
    database.engine = test_engine
    create_db_and_tables()
    assert "users" in SQLModel.metadata.tables
    assert "products" in SQLModel.metadata.tables
    database.engine = original_engine


def test_get_session_yields_session():
    gen = get_session()
    session = next(gen)
    assert isinstance(session, Session)
    try:
        next(gen)
    except StopIteration:
        pass
