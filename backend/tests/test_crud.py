from decimal import Decimal
from sqlmodel import Session
from app.models.user import UserCreate, UserUpdate, Role
from app.models.product import ProductCreate, ProductUpdate
from app.crud.user import (
    create_user,
    get_user,
    get_user_by_email,
    get_users,
    update_user,
    delete_user,
)
from app.crud.product import (
    create_product,
    get_product,
    get_product_by_sku,
    get_products,
    update_product,
    delete_product,
)


def make_user_create(suffix: str = "1") -> UserCreate:
    return UserCreate(
        username=f"user{suffix}",
        email=f"user{suffix}@example.com",
        role=Role.SALES_STAFF,
        hashed_password="hashed",
    )


def make_product_create(suffix: str = "1") -> ProductCreate:
    return ProductCreate(
        name=f"Product {suffix}",
        sku=f"SKU-{suffix}",
        price_cost=Decimal("10.00"),
        quantity=50,
        min_stock_level=5,
        category="General",
    )


def test_create_user(session: Session):
    user = create_user(session, make_user_create())
    assert user.id is not None
    assert user.username == "user1"
    assert user.email == "user1@example.com"


def test_get_user(session: Session):
    created = create_user(session, make_user_create())
    fetched = get_user(session, created.id)
    assert fetched is not None
    assert fetched.id == created.id


def test_get_user_not_found(session: Session):
    result = get_user(session, 9999)
    assert result is None


def test_get_user_by_email(session: Session):
    create_user(session, make_user_create())
    fetched = get_user_by_email(session, "user1@example.com")
    assert fetched is not None
    assert fetched.email == "user1@example.com"


def test_get_user_by_email_not_found(session: Session):
    result = get_user_by_email(session, "nonexistent@example.com")
    assert result is None


def test_get_users(session: Session):
    create_user(session, make_user_create("a"))
    create_user(session, make_user_create("b"))
    users = get_users(session)
    assert len(users) == 2


def test_get_users_with_offset_and_limit(session: Session):
    for i in range(5):
        create_user(session, make_user_create(str(i)))
    users = get_users(session, offset=2, limit=2)
    assert len(users) == 2


def test_update_user(session: Session):
    created = create_user(session, make_user_create())
    updated = update_user(session, created.id, UserUpdate(username="updated_name"))
    assert updated is not None
    assert updated.username == "updated_name"
    assert updated.email == "user1@example.com"


def test_update_user_not_found(session: Session):
    result = update_user(session, 9999, UserUpdate(username="ghost"))
    assert result is None


def test_delete_user(session: Session):
    created = create_user(session, make_user_create())
    deleted = delete_user(session, created.id)
    assert deleted is not None
    assert get_user(session, created.id) is None


def test_delete_user_not_found(session: Session):
    result = delete_user(session, 9999)
    assert result is None


def test_create_product(session: Session):
    product = create_product(session, make_product_create())
    assert product.id is not None
    assert product.name == "Product 1"
    assert product.sku == "SKU-1"


def test_get_product(session: Session):
    created = create_product(session, make_product_create())
    fetched = get_product(session, created.id)
    assert fetched is not None
    assert fetched.id == created.id


def test_get_product_not_found(session: Session):
    result = get_product(session, 9999)
    assert result is None


def test_get_product_by_sku(session: Session):
    create_product(session, make_product_create())
    fetched = get_product_by_sku(session, "SKU-1")
    assert fetched is not None
    assert fetched.sku == "SKU-1"


def test_get_product_by_sku_not_found(session: Session):
    result = get_product_by_sku(session, "NONEXISTENT")
    assert result is None


def test_get_products(session: Session):
    create_product(session, make_product_create("a"))
    create_product(session, make_product_create("b"))
    products = get_products(session)
    assert len(products) == 2


def test_get_products_with_offset_and_limit(session: Session):
    for i in range(5):
        create_product(session, make_product_create(str(i)))
    products = get_products(session, offset=1, limit=3)
    assert len(products) == 3


def test_update_product(session: Session):
    created = create_product(session, make_product_create())
    updated = update_product(
        session, created.id, ProductUpdate(name="New Name", price_cost=Decimal("20.00"))
    )
    assert updated is not None
    assert updated.name == "New Name"
    assert updated.price_cost == Decimal("20.00")
    assert updated.sku == "SKU-1"


def test_update_product_not_found(session: Session):
    result = update_product(session, 9999, ProductUpdate(name="Ghost"))
    assert result is None


def test_delete_product(session: Session):
    created = create_product(session, make_product_create())
    deleted = delete_product(session, created.id)
    assert deleted is not None
    assert get_product(session, created.id) is None


def test_delete_product_not_found(session: Session):
    result = delete_product(session, 9999)
    assert result is None
