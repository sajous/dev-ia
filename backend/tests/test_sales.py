from decimal import Decimal
from fastapi.testclient import TestClient
from sqlmodel import Session, select
from app.core.security import get_password_hash, create_access_token
from app.crud.user import create_user
from app.crud.product import create_product
from app.models.user import UserCreate, Role
from app.models.product import ProductCreate
from app.models.sale import Sale, SaleItem


def make_token(session: Session, role: Role, suffix: str) -> tuple[str, int]:
    hashed = get_password_hash("pass")
    user = create_user(
        session,
        UserCreate(
            username=f"sales_user_{suffix}",
            email=f"sales_{suffix}@example.com",
            role=role,
            hashed_password=hashed,
        ),
    )
    return create_access_token(data={"sub": str(user.id)}), user.id


def make_product(session: Session, suffix: str = "1", quantity: int = 100) -> tuple[int, Decimal]:
    product = create_product(
        session,
        ProductCreate(
            name=f"Product {suffix}",
            sku=f"SALE-PROD-{suffix}",
            price_cost=Decimal("50.00"),
            quantity=quantity,
            min_stock_level=5,
            category="Test",
        ),
    )
    return product.id, product.price_cost


def test_post_sales_success(client: TestClient, session: Session):
    token, user_id = make_token(session, Role.SALES_STAFF, "post_ok")
    product_id, price = make_product(session, "post_ok", quantity=10)

    response = client.post(
        "/sales",
        json={"items": [{"product_id": product_id, "quantity": 3}]},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 201
    data = response.json()
    assert data["user_id"] == user_id
    assert Decimal(data["total_price"]) == price * 3
    assert len(data["items"]) == 1
    assert data["items"][0]["quantity"] == 3
    assert Decimal(data["items"][0]["unit_price"]) == price
    assert data["items"][0]["product"]["id"] == product_id


def test_post_sales_updates_stock(client: TestClient, session: Session):
    token, _ = make_token(session, Role.SALES_STAFF, "stock_upd")
    product_id, _ = make_product(session, "stock_upd", quantity=20)

    client.post(
        "/sales",
        json={"items": [{"product_id": product_id, "quantity": 5}]},
        headers={"Authorization": f"Bearer {token}"},
    )

    session.expire_all()
    from app.models.product import Product
    product = session.get(Product, product_id)
    assert product.quantity == 15


def test_post_sales_creates_db_records(client: TestClient, session: Session):
    token, _ = make_token(session, Role.SALES_STAFF, "db_rec")
    product_id, _ = make_product(session, "db_rec", quantity=10)

    response = client.post(
        "/sales",
        json={"items": [{"product_id": product_id, "quantity": 2}]},
        headers={"Authorization": f"Bearer {token}"},
    )

    sale_id = response.json()["id"]
    sale = session.get(Sale, sale_id)
    assert sale is not None

    statement = select(SaleItem).where(SaleItem.sale_id == sale_id)
    items = list(session.exec(statement).all())
    assert len(items) == 1
    assert items[0].product_id == product_id
    assert items[0].quantity == 2


def test_post_sales_multiple_items(client: TestClient, session: Session):
    token, _ = make_token(session, Role.SALES_STAFF, "multi")
    p1, price1 = make_product(session, "multi_a", quantity=10)
    p2, price2 = make_product(session, "multi_b", quantity=10)

    response = client.post(
        "/sales",
        json={"items": [{"product_id": p1, "quantity": 2}, {"product_id": p2, "quantity": 3}]},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 201
    data = response.json()
    expected_total = price1 * 2 + price2 * 3
    assert Decimal(data["total_price"]) == expected_total
    assert len(data["items"]) == 2


def test_post_sales_insufficient_stock_returns_400(client: TestClient, session: Session):
    token, _ = make_token(session, Role.SALES_STAFF, "insuf")
    product_id, _ = make_product(session, "insuf", quantity=5)

    response = client.post(
        "/sales",
        json={"items": [{"product_id": product_id, "quantity": 10}]},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 400
    assert "Insufficient stock" in response.json()["detail"]


def test_post_sales_insufficient_stock_no_sale_created(client: TestClient, session: Session):
    token, _ = make_token(session, Role.SALES_STAFF, "rollback")
    product_id, _ = make_product(session, "rollback", quantity=2)

    client.post(
        "/sales",
        json={"items": [{"product_id": product_id, "quantity": 99}]},
        headers={"Authorization": f"Bearer {token}"},
    )

    sales = list(session.exec(select(Sale)).all())
    assert len(sales) == 0
    sale_items = list(session.exec(select(SaleItem)).all())
    assert len(sale_items) == 0


def test_post_sales_insufficient_stock_stock_unchanged(client: TestClient, session: Session):
    token, _ = make_token(session, Role.SALES_STAFF, "no_deduct")
    product_id, _ = make_product(session, "no_deduct", quantity=3)

    client.post(
        "/sales",
        json={"items": [{"product_id": product_id, "quantity": 10}]},
        headers={"Authorization": f"Bearer {token}"},
    )

    session.expire_all()
    from app.models.product import Product
    product = session.get(Product, product_id)
    assert product.quantity == 3


def test_post_sales_product_not_found(client: TestClient, session: Session):
    token, _ = make_token(session, Role.SALES_STAFF, "notfound")

    response = client.post(
        "/sales",
        json={"items": [{"product_id": 99999, "quantity": 1}]},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 400
    assert "not found" in response.json()["detail"]


def test_post_sales_unauthenticated(client: TestClient):
    response = client.post("/sales", json={"items": [{"product_id": 1, "quantity": 1}]})
    assert response.status_code == 401


def test_get_sales_sales_manager_sees_all(client: TestClient, session: Session):
    token_staff, _ = make_token(session, Role.SALES_STAFF, "staff_a")
    token_mgr, _ = make_token(session, Role.SALES_MANAGER, "mgr_a")
    product_id, _ = make_product(session, "see_all", quantity=20)

    client.post(
        "/sales",
        json={"items": [{"product_id": product_id, "quantity": 1}]},
        headers={"Authorization": f"Bearer {token_staff}"},
    )

    response = client.get("/sales", headers={"Authorization": f"Bearer {token_mgr}"})
    assert response.status_code == 200
    assert len(response.json()) == 1


def test_get_sales_owner_sees_all(client: TestClient, session: Session):
    token_staff, _ = make_token(session, Role.SALES_STAFF, "staff_own")
    token_owner, _ = make_token(session, Role.OWNER, "owner_a")
    product_id, _ = make_product(session, "owner_all", quantity=20)

    client.post(
        "/sales",
        json={"items": [{"product_id": product_id, "quantity": 1}]},
        headers={"Authorization": f"Bearer {token_staff}"},
    )

    response = client.get("/sales", headers={"Authorization": f"Bearer {token_owner}"})
    assert response.status_code == 200
    assert len(response.json()) == 1


def test_get_sales_staff_sees_only_own(client: TestClient, session: Session):
    token1, _ = make_token(session, Role.SALES_STAFF, "staff_own1")
    token2, _ = make_token(session, Role.SALES_STAFF, "staff_own2")
    product_id, _ = make_product(session, "own_filter", quantity=20)

    client.post(
        "/sales",
        json={"items": [{"product_id": product_id, "quantity": 1}]},
        headers={"Authorization": f"Bearer {token1}"},
    )
    client.post(
        "/sales",
        json={"items": [{"product_id": product_id, "quantity": 1}]},
        headers={"Authorization": f"Bearer {token2}"},
    )

    response = client.get("/sales", headers={"Authorization": f"Bearer {token1}"})
    assert response.status_code == 200
    assert len(response.json()) == 1


def test_get_sales_forbidden_for_stock_staff(client: TestClient, session: Session):
    token, _ = make_token(session, Role.STOCK_STAFF, "no_sales")
    response = client.get("/sales", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 403


def test_get_sales_unauthenticated(client: TestClient):
    response = client.get("/sales")
    assert response.status_code == 401


def test_get_sales_includes_items_and_product_info(client: TestClient, session: Session):
    token, _ = make_token(session, Role.SALES_STAFF, "with_items")
    product_id, _ = make_product(session, "with_items", quantity=10)

    client.post(
        "/sales",
        json={"items": [{"product_id": product_id, "quantity": 2}]},
        headers={"Authorization": f"Bearer {token}"},
    )

    response = client.get("/sales", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    sale = response.json()[0]
    assert len(sale["items"]) == 1
    assert sale["items"][0]["product"]["id"] == product_id
    assert sale["items"][0]["product"]["name"] == "Product with_items"
