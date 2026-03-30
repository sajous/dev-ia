from fastapi.testclient import TestClient
from sqlmodel import Session
from app.core.security import get_password_hash, create_access_token
from app.crud.user import create_user
from app.models.user import UserCreate, Role


def make_user_with_role(session: Session, role: Role, suffix: str) -> str:
    password = "testpass"
    hashed = get_password_hash(password)
    user = create_user(
        session,
        UserCreate(
            username=f"user_{suffix}",
            email=f"user_{suffix}@example.com",
            role=role,
            hashed_password=hashed,
        ),
    )
    return create_access_token(data={"sub": str(user.id)})


def test_has_role_stock_manager_allowed_on_patch(client: TestClient, session: Session):
    token = make_user_with_role(session, Role.STOCK_MANAGER, "mgr_patch")
    response = client.patch(
        "/products/9999",
        json={"min_stock_level": 5},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 404


def test_has_role_stock_staff_denied_on_patch(client: TestClient, session: Session):
    token = make_user_with_role(session, Role.STOCK_STAFF, "staff_patch")
    response = client.patch(
        "/products/1",
        json={"min_stock_level": 5},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 403


def test_has_role_sales_staff_denied_on_patch(client: TestClient, session: Session):
    token = make_user_with_role(session, Role.SALES_STAFF, "sales_patch")
    response = client.patch(
        "/products/1",
        json={"min_stock_level": 5},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 403


def test_has_role_stock_staff_allowed_on_post(client: TestClient, session: Session):
    token = make_user_with_role(session, Role.STOCK_STAFF, "staff_post")
    product_data = {
        "name": "Test Product",
        "sku": "SKU-DEPS-001",
        "price_cost": "10.00",
        "quantity": 5,
        "min_stock_level": 1,
        "category": "Test",
    }
    response = client.post(
        "/products",
        json=product_data,
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 201


def test_has_role_sales_staff_denied_on_post(client: TestClient, session: Session):
    token = make_user_with_role(session, Role.SALES_STAFF, "sales_post")
    product_data = {
        "name": "Test Product",
        "sku": "SKU-DEPS-002",
        "price_cost": "10.00",
        "quantity": 5,
        "min_stock_level": 1,
        "category": "Test",
    }
    response = client.post(
        "/products",
        json=product_data,
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 403


def test_has_role_hr_manager_denied_on_post(client: TestClient, session: Session):
    token = make_user_with_role(session, Role.HR_MANAGER, "hr_post")
    product_data = {
        "name": "Test Product",
        "sku": "SKU-DEPS-003",
        "price_cost": "10.00",
        "quantity": 5,
        "min_stock_level": 1,
        "category": "Test",
    }
    response = client.post(
        "/products",
        json=product_data,
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 403
