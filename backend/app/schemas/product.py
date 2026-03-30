from decimal import Decimal
from typing import Optional
from pydantic import BaseModel


class ProductCreateSchema(BaseModel):
    name: str
    sku: str
    price_cost: Decimal
    quantity: int
    min_stock_level: int
    category: str
    description: Optional[str] = None
    history: Optional[str] = None


class ProductUpdateSchema(BaseModel):
    name: Optional[str] = None
    sku: Optional[str] = None
    price_cost: Optional[Decimal] = None
    quantity: Optional[int] = None
    min_stock_level: Optional[int] = None
    category: Optional[str] = None
    description: Optional[str] = None
    history: Optional[str] = None


class ProductStaffViewSchema(BaseModel):
    id: int
    name: str
    sku: str
    quantity: int

    model_config = {"from_attributes": True}


class ProductManagerViewSchema(BaseModel):
    id: int
    name: str
    sku: str
    quantity: int
    price_cost: Decimal
    min_stock_level: int
    history: Optional[str] = None

    model_config = {"from_attributes": True}
