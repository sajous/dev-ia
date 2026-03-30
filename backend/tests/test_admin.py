from fastapi.testclient import TestClient
from sqlmodel import Session
from app.core.security import get_password_hash, create_access_token
from app.crud.user import create_user
from app.models.user import UserCreate, Role


def make_token(session: Session, role: Role, suffix: str) -> str:
    hashed = get_password_hash("pass")
    user = create_user(
        session,
        UserCreate(
            username=f"admin_user_{suffix}",
            email=f"admin_{suffix}@example.com",
            role=role,
            hashed_password=hashed,
            name=f"User {suffix}",
        ),
    )
    return create_access_token(data={"sub": str(user.id)})


def test_list_users_as_admin_returns_200(client: TestClient, session: Session):
    token = make_token(session, Role.ADMIN, "admin1")
    response = client.get("/admin/users", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    user = data[0]
    assert "id" in user
    assert "email" in user
    assert "role" in user
    assert "created_at" in user


def test_list_users_as_hr_manager_returns_200(client: TestClient, session: Session):
    token = make_token(session, Role.HR_MANAGER, "hr1")
    response = client.get("/admin/users", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


def test_list_users_as_stock_manager_denied(client: TestClient, session: Session):
    token = make_token(session, Role.STOCK_MANAGER, "stock1")
    response = client.get("/admin/users", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 403


def test_list_users_as_stock_staff_denied(client: TestClient, session: Session):
    token = make_token(session, Role.STOCK_STAFF, "staff1")
    response = client.get("/admin/users", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 403


def test_list_users_as_sales_staff_denied(client: TestClient, session: Session):
    token = make_token(session, Role.SALES_STAFF, "sales1")
    response = client.get("/admin/users", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 403


def test_list_users_as_sales_manager_denied(client: TestClient, session: Session):
    token = make_token(session, Role.SALES_MANAGER, "salesmgr1")
    response = client.get("/admin/users", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 403


def test_list_users_as_customer_denied(client: TestClient, session: Session):
    token = make_token(session, Role.CUSTOMER, "cust1")
    response = client.get("/admin/users", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 403


def test_list_users_unauthenticated(client: TestClient):
    response = client.get("/admin/users")
    assert response.status_code == 401


def test_list_users_returns_correct_fields(client: TestClient, session: Session):
    token = make_token(session, Role.ADMIN, "admin_fields")
    response = client.get("/admin/users", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    user = response.json()[0]
    assert set(["id", "name", "email", "role", "created_at"]).issubset(set(user.keys()))


def test_list_users_multiple_users(client: TestClient, session: Session):
    token = make_token(session, Role.ADMIN, "admin_multi")
    make_token(session, Role.STOCK_STAFF, "extra1")
    make_token(session, Role.HR_MANAGER, "extra2")
    response = client.get("/admin/users", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert len(response.json()) >= 3
