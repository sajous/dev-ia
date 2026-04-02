from datetime import datetime
from decimal import Decimal
from typing import List
from pydantic import BaseModel


class SaleItemRequest(BaseModel):
    product_id: int
    quantity: int


class SaleCreateRequest(BaseModel):
    items: List[SaleItemRequest]


class SaleItemProductInfo(BaseModel):
    id: int
    name: str
    sku: str

    model_config = {"from_attributes": True}


class SaleItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    unit_price: Decimal
    product: SaleItemProductInfo | None = None

    model_config = {"from_attributes": True}


class SaleResponse(BaseModel):
    id: int
    user_id: int
    total_price: Decimal
    timestamp: datetime
    items: List[SaleItemResponse]

    model_config = {"from_attributes": True}
