from decimal import Decimal
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from app.schemas.sale import SaleCreateRequest, SaleItemResponse, SaleItemProductInfo, SaleResponse
from app.api.deps import get_current_user, has_role
from app.models.user import User, Role
from app.models.sale import Sale, SaleItem
from app.models.product import Product
from database import get_session

router = APIRouter(prefix="/sales", tags=["sales"])


@router.post("", status_code=status.HTTP_201_CREATED, response_model=SaleResponse)
def create_sale(
    sale_in: SaleCreateRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    validated = []
    total = Decimal("0")

    for item in sale_in.items:
        product = session.get(Product, item.product_id)
        if not product:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product with id {item.product_id} not found",
            )
        if product.quantity < item.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Insufficient stock for '{product.name}': "
                    f"available {product.quantity}, requested {item.quantity}"
                ),
            )
        validated.append((product, item.quantity, product.price_cost))
        total += product.price_cost * item.quantity

    sale = Sale(user_id=current_user.id, total_price=total)
    session.add(sale)
    session.flush()

    for product, quantity, unit_price in validated:
        product.quantity -= quantity
        session.add(product)
        session.add(SaleItem(sale_id=sale.id, product_id=product.id, quantity=quantity, unit_price=unit_price))

    session.commit()
    session.refresh(sale)

    items_response = []
    for db_item in sale.items:
        db_product = session.get(Product, db_item.product_id)
        product_info = SaleItemProductInfo.model_validate(db_product) if db_product else None
        items_response.append(
            SaleItemResponse(
                id=db_item.id,
                product_id=db_item.product_id,
                quantity=db_item.quantity,
                unit_price=db_item.unit_price,
                product=product_info,
            )
        )

    return SaleResponse(
        id=sale.id,
        user_id=sale.user_id,
        total_price=sale.total_price,
        timestamp=sale.timestamp,
        items=items_response,
    )


@router.get("", response_model=List[SaleResponse])
def list_sales(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in [Role.SALES_MANAGER, Role.OWNER, Role.SALES_STAFF]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions",
        )

    if current_user.role == Role.SALES_STAFF:
        statement = select(Sale).where(Sale.user_id == current_user.id)
    else:
        statement = select(Sale)

    sales = list(session.exec(statement).all())
    result = []

    for sale in sales:
        items_response = []
        for db_item in sale.items:
            db_product = session.get(Product, db_item.product_id)
            product_info = SaleItemProductInfo.model_validate(db_product) if db_product else None
            items_response.append(
                SaleItemResponse(
                    id=db_item.id,
                    product_id=db_item.product_id,
                    quantity=db_item.quantity,
                    unit_price=db_item.unit_price,
                    product=product_info,
                )
            )
        result.append(
            SaleResponse(
                id=sale.id,
                user_id=sale.user_id,
                total_price=sale.total_price,
                timestamp=sale.timestamp,
                items=items_response,
            )
        )

    return result
