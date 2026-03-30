from decimal import Decimal
from fastapi.testclient import TestClient
from sqlmodel import Session
from app.core.security import get_password_hash, create_access_token
from app.crud.user import create_user
from app.crud.product import create_product
from app.models.user import UserCreate, Role
from app.models.product import ProductCreate


def make_token(session: Session, role: Role, suffix: str) -> str:
    hashed = get_password_hash("pass")
    user = create_user(
        session,
        UserCreate(
            username=f"prod_user_{suffix}",
            email=f"prod_{suffix}@example.com",
            role=role,
            hashed_password=hashed,
        ),
    )
    return create_access_token(data={"sub": str(user.id)})


def make_product(session: Session, suffix: str = "1") -> int:
    product = create_product(
        session,
        ProductCreate(
            name=f"Product {suffix}",
            sku=f"PROD-{suffix}",
            price_cost=Decimal("25.00"),
            quantity=100,
            min_stock_level=10,
            category="Electronics",
            history='[{"event": "created"}]',
        ),
    )
    return product.id


def product_payload(sku: str = "NEW-001") -> dict:
    return {
        "name": "New Product",
        "sku": sku,
        "price_cost": "15.00",
        "quantity": 20,
        "min_stock_level": 5,
        "category": "Tools",
    }


def test_post_products_stock_staff_allowed(client: TestClient, session: Session):
    token = make_token(session, Role.STOCK_STAFF, "post_staff")
    response = client.post(
        "/products",
        json=product_payload("POST-STAFF-001"),
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "New Product"
    assert data["sku"] == "POST-STAFF-001"


def test_post_products_stock_manager_allowed(client: TestClient, session: Session):
    token = make_token(session, Role.STOCK_MANAGER, "post_mgr")
    response = client.post(
        "/products",
        json=product_payload("POST-MGR-001"),
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 201


def test_post_products_sales_staff_denied(client: TestClient, session: Session):
    token = make_token(session, Role.SALES_STAFF, "post_sales")
    response = client.post(
        "/products",
        json=product_payload("POST-SALES-001"),
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 403


def test_post_products_unauthenticated(client: TestClient):
    response = client.post("/products", json=product_payload("POST-ANON-001"))
    assert response.status_code == 401


def test_get_products_stock_staff_view(client: TestClient, session: Session):
    token = make_token(session, Role.STOCK_STAFF, "get_staff")
    make_product(session, "staff-view")
    response = client.get("/products", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    item = data[0]
    assert "name" in item
    assert "sku" in item
    assert "quantity" in item
    assert "price_cost" not in item
    assert "history" not in item


def test_get_products_stock_manager_view(client: TestClient, session: Session):
    token = make_token(session, Role.STOCK_MANAGER, "get_mgr")
    make_product(session, "mgr-view")
    response = client.get("/products", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    item = data[0]
    assert "price_cost" in item
    assert "min_stock_level" in item
    assert "history" in item


def test_get_products_unauthenticated(client: TestClient):
    response = client.get("/products")
    assert response.status_code == 401


def test_get_products_sales_staff_returns_staff_view(client: TestClient, session: Session):
    token = make_token(session, Role.SALES_STAFF, "get_sales")
    make_product(session, "sales-view")
    response = client.get("/products", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    item = response.json()[0]
    assert "price_cost" not in item


def test_patch_product_stock_manager_success(client: TestClient, session: Session):
    token = make_token(session, Role.STOCK_MANAGER, "patch_mgr")
    product_id = make_product(session, "patch-target")
    response = client.patch(
        f"/products/{product_id}",
        json={"min_stock_level": 20, "price_cost": "30.00"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["min_stock_level"] == 20


def test_patch_product_stock_staff_denied(client: TestClient, session: Session):
    token = make_token(session, Role.STOCK_STAFF, "patch_staff")
    product_id = make_product(session, "patch-staff-target")
    response = client.patch(
        f"/products/{product_id}",
        json={"min_stock_level": 5},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 403


def test_patch_product_not_found(client: TestClient, session: Session):
    token = make_token(session, Role.STOCK_MANAGER, "patch_notfound")
    response = client.patch(
        "/products/99999",
        json={"min_stock_level": 5},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 404


def test_patch_product_unauthenticated(client: TestClient, session: Session):
    product_id = make_product(session, "patch-anon")
    response = client.patch(f"/products/{product_id}", json={"min_stock_level": 5})
    assert response.status_code == 401


def test_patch_product_sales_manager_denied(client: TestClient, session: Session):
    token = make_token(session, Role.SALES_MANAGER, "patch_sales_mgr")
    product_id = make_product(session, "patch-sales-mgr")
    response = client.patch(
        f"/products/{product_id}",
        json={"min_stock_level": 5},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 403
