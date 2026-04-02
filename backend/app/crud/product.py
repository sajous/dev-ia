from typing import Optional
from sqlmodel import Session, select
from app.models.product import Product, ProductCreate, ProductUpdate


def create_product(session: Session, product: ProductCreate) -> Product:
    db_product = Product.model_validate(product)
    session.add(db_product)
    session.commit()
    session.refresh(db_product)
    return db_product


def get_product(session: Session, product_id: int) -> Optional[Product]:
    return session.get(Product, product_id)


def get_product_by_sku(session: Session, sku: str) -> Optional[Product]:
    statement = select(Product).where(Product.sku == sku)
    return session.exec(statement).first()


def get_products(session: Session, offset: int = 0, limit: int = 100, search: str | None = None) -> list[Product]:
    statement = select(Product)
    if search:
        statement = statement.where(
            (Product.name.ilike(f"%{search}%")) | (Product.sku.ilike(f"%{search}%"))
        )
    statement = statement.offset(offset).limit(limit)
    return list(session.exec(statement).all())


def update_product(session: Session, product_id: int, product_update: ProductUpdate) -> Optional[Product]:
    db_product = session.get(Product, product_id)
    if not db_product:
        return None
    update_data = product_update.model_dump(exclude_unset=True)
    db_product.sqlmodel_update(update_data)
    session.add(db_product)
    session.commit()
    session.refresh(db_product)
    return db_product


def delete_product(session: Session, product_id: int) -> Optional[Product]:
    db_product = session.get(Product, product_id)
    if not db_product:
        return None
    session.delete(db_product)
    session.commit()
    return db_product
