import pytest
from decimal import Decimal
from pydantic import ValidationError
from app.models.user import User, UserCreate, UserUpdate, Role
from app.models.product import Product, ProductCreate, ProductUpdate


def test_user_create_valid():
    user = UserCreate(
        username="john",
        email="john@example.com",
        role=Role.SALES_STAFF,
        hashed_password="hashed123",
    )
    assert user.username == "john"
    assert user.email == "john@example.com"
    assert user.role == Role.SALES_STAFF
    assert user.hashed_password == "hashed123"


def test_user_role_values():
    assert Role.STOCK_STAFF == "STOCK_STAFF"
    assert Role.STOCK_MANAGER == "STOCK_MANAGER"
    assert Role.SALES_STAFF == "SALES_STAFF"
    assert Role.SALES_MANAGER == "SALES_MANAGER"
    assert Role.HR_MANAGER == "HR_MANAGER"


def test_user_update_partial():
    update = UserUpdate(username="new_name")
    assert update.username == "new_name"
    assert update.email is None
    assert update.role is None
    assert update.hashed_password is None


def test_user_update_all_fields():
    update = UserUpdate(
        username="updated",
        email="updated@example.com",
        role=Role.HR_MANAGER,
        hashed_password="newhash",
    )
    assert update.username == "updated"
    assert update.email == "updated@example.com"
    assert update.role == Role.HR_MANAGER
    assert update.hashed_password == "newhash"


def test_product_create_valid():
    product = ProductCreate(
        name="Widget",
        sku="WID-001",
        price_cost=Decimal("9.99"),
        quantity=100,
        min_stock_level=10,
        category="Electronics",
    )
    assert product.name == "Widget"
    assert product.sku == "WID-001"
    assert product.price_cost == Decimal("9.99")
    assert product.quantity == 100
    assert product.min_stock_level == 10
    assert product.category == "Electronics"
    assert product.description is None
    assert product.history is None


def test_product_create_with_description():
    product = ProductCreate(
        name="Widget",
        description="A great widget",
        sku="WID-002",
        price_cost=Decimal("19.99"),
        quantity=50,
        min_stock_level=5,
        category="Tools",
    )
    assert product.description == "A great widget"


def test_product_create_with_history():
    product = ProductCreate(
        name="Widget",
        sku="WID-003",
        price_cost=Decimal("5.00"),
        quantity=10,
        min_stock_level=2,
        category="Tools",
        history='[{"date": "2026-01-01", "event": "created"}]',
    )
    assert product.history is not None


def test_product_create_zero_price():
    product = ProductCreate(
        name="Free Item",
        sku="FREE-001",
        price_cost=Decimal("0"),
        quantity=0,
        min_stock_level=0,
        category="Promo",
    )
    assert product.price_cost == Decimal("0")


def test_product_create_invalid_negative_price():
    with pytest.raises(ValidationError):
        ProductCreate(
            name="Bad",
            sku="BAD-001",
            price_cost=Decimal("-1"),
            quantity=0,
            min_stock_level=0,
            category="Test",
        )


def test_product_create_invalid_negative_quantity():
    with pytest.raises(ValidationError):
        ProductCreate(
            name="Bad",
            sku="BAD-002",
            price_cost=Decimal("1"),
            quantity=-1,
            min_stock_level=0,
            category="Test",
        )


def test_product_create_invalid_negative_min_stock():
    with pytest.raises(ValidationError):
        ProductCreate(
            name="Bad",
            sku="BAD-003",
            price_cost=Decimal("1"),
            quantity=0,
            min_stock_level=-1,
            category="Test",
        )


def test_product_update_partial():
    update = ProductUpdate(name="New Name")
    assert update.name == "New Name"
    assert update.sku is None
    assert update.price_cost is None
    assert update.quantity is None
    assert update.min_stock_level is None
    assert update.category is None
    assert update.history is None


def test_product_update_all_fields():
    update = ProductUpdate(
        name="Updated",
        description="Updated desc",
        sku="UPD-001",
        price_cost=Decimal("5.00"),
        quantity=20,
        min_stock_level=2,
        category="Updated Cat",
        history='[{"event": "updated"}]',
    )
    assert update.name == "Updated"
    assert update.description == "Updated desc"
    assert update.sku == "UPD-001"
    assert update.price_cost == Decimal("5.00")
    assert update.quantity == 20
    assert update.min_stock_level == 2
    assert update.category == "Updated Cat"
    assert update.history is not None
