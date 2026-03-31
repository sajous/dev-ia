from datetime import timedelta
from fastapi.testclient import TestClient
from sqlmodel import Session
from jose import JWTError
import pytest
from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    decode_token,
)
from app.crud.user import create_user
from app.models.user import UserCreate, Role


def make_user(session: Session, email: str, password: str, role: Role = Role.STOCK_STAFF) -> None:
    hashed = get_password_hash(password)
    create_user(
        session,
        UserCreate(
            username=email.split("@")[0],
            email=email,
            role=role,
            hashed_password=hashed,
        ),
    )


def test_get_password_hash_returns_string():
    hashed = get_password_hash("mypassword")
    assert isinstance(hashed, str)
    assert hashed != "mypassword"


def test_verify_password_correct():
    hashed = get_password_hash("secret")
    assert verify_password("secret", hashed) is True


def test_verify_password_incorrect():
    hashed = get_password_hash("secret")
    assert verify_password("wrong", hashed) is False


def test_create_access_token_returns_string():
    token = create_access_token(data={"sub": "1"})
    assert isinstance(token, str)
    assert len(token) > 0


def test_decode_token_returns_payload():
    token = create_access_token(data={"sub": "42"})
    payload = decode_token(token)
    assert payload["sub"] == "42"


def test_decode_token_expired_raises():
    token = create_access_token(data={"sub": "1"}, expires_delta=timedelta(seconds=-1))
    with pytest.raises(JWTError):
        decode_token(token)


def test_login_success(client: TestClient, session: Session):
    make_user(session, "staff@example.com", "password123")
    response = client.post("/auth/login", json={"email": "staff@example.com", "password": "password123"})
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_wrong_password(client: TestClient, session: Session):
    make_user(session, "staff2@example.com", "correct")
    response = client.post("/auth/login", json={"email": "staff2@example.com", "password": "wrong"})
    assert response.status_code == 401


def test_login_wrong_email(client: TestClient, session: Session):
    response = client.post("/auth/login", json={"email": "nobody@example.com", "password": "pass"})
    assert response.status_code == 401


def test_get_current_user_valid_token(client: TestClient, session: Session):
    make_user(session, "valid@example.com", "pass123")
    login_resp = client.post("/auth/login", json={"email": "valid@example.com", "password": "pass123"})
    token = login_resp.json()["access_token"]
    response = client.get("/products", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200


def test_get_current_user_invalid_token(client: TestClient):
    response = client.get("/products", headers={"Authorization": "Bearer invalidtoken"})
    assert response.status_code == 401


def test_get_current_user_expired_token(client: TestClient, session: Session):
    make_user(session, "expired@example.com", "pass")
    from app.crud.user import get_user_by_email
    user = get_user_by_email(session, "expired@example.com")
    expired_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=timedelta(seconds=-1)
    )
    response = client.get("/products", headers={"Authorization": f"Bearer {expired_token}"})
    assert response.status_code == 401


def test_get_current_user_nonexistent_user(client: TestClient):
    token = create_access_token(data={"sub": "99999"})
    response = client.get("/products", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 401


def test_get_current_user_missing_sub(client: TestClient):
    token = create_access_token(data={"data": "no_sub"})
    response = client.get("/products", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 401


def test_options_login_not_405(client: TestClient):
    response = client.options(
        "/auth/login",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "Content-Type",
        },
    )
    assert response.status_code != 405


def test_login_success_returns_token(client: TestClient, session: Session):
    make_user(session, "cors_user@example.com", "securepass")
    response = client.post(
        "/auth/login",
        json={"email": "cors_user@example.com", "password": "securepass"},
        headers={"Origin": "http://localhost:5173"},
    )
    assert response.status_code == 200
    assert "access_token" in response.json()


def test_login_invalid_credentials_returns_401(client: TestClient, session: Session):
    make_user(session, "cors_invalid@example.com", "correctpass")
    response = client.post(
        "/auth/login",
        json={"email": "cors_invalid@example.com", "password": "wrongpass"},
        headers={"Origin": "http://localhost:5173"},
    )
    assert response.status_code == 401
