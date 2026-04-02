from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session
from app.schemas.product import (
    ProductCreateSchema,
    ProductUpdateSchema,
    ProductStaffViewSchema,
    ProductManagerViewSchema,
    ProductPdvViewSchema,
)
from app.api.deps import get_current_user, has_role
from app.models.user import User, Role
from app.models.product import ProductCreate, ProductUpdate
from app.crud.product import create_product, get_products, get_product, update_product
from database import get_session

router = APIRouter(prefix="/products", tags=["products"])

SALES_ROLES = [Role.SALES_STAFF, Role.SALES_MANAGER]


@router.post("", status_code=status.HTTP_201_CREATED)
def create_new_product(
    product_in: ProductCreateSchema,
    session: Session = Depends(get_session),
    _: User = Depends(has_role([Role.STOCK_STAFF, Role.STOCK_MANAGER])),
):
    return create_product(session, ProductCreate(**product_in.model_dump()))


@router.get("", response_model=List)
def list_products(
    search: Optional[str] = None,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    products = get_products(session, search=search)
    if current_user.role == Role.STOCK_MANAGER:
        return [ProductManagerViewSchema.model_validate(p) for p in products]
    if current_user.role in SALES_ROLES:
        return [ProductPdvViewSchema.model_validate(p) for p in products]
    return [ProductStaffViewSchema.model_validate(p) for p in products]


@router.patch("/{product_id}")
def update_existing_product(
    product_id: int,
    product_in: ProductUpdateSchema,
    session: Session = Depends(get_session),
    _: User = Depends(has_role([Role.STOCK_MANAGER])),
):
    updated = update_product(
        session, product_id, ProductUpdate(**product_in.model_dump(exclude_unset=True))
    )
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )
    return updated
