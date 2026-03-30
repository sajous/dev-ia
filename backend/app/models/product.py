from decimal import Decimal
from typing import Optional
from sqlmodel import SQLModel, Field


class ProductBase(SQLModel):
    name: str = Field(index=True)
    description: Optional[str] = None
    sku: str = Field(unique=True, index=True)
    price_cost: Decimal = Field(ge=0)
    quantity: int = Field(ge=0)
    min_stock_level: int = Field(ge=0)
    category: str = Field(index=True)
    history: Optional[str] = None


class Product(ProductBase, table=True):
    __tablename__ = "products"
    id: Optional[int] = Field(default=None, primary_key=True)


class ProductCreate(ProductBase):
    pass


class ProductUpdate(SQLModel):
    name: Optional[str] = None
    description: Optional[str] = None
    sku: Optional[str] = None
    price_cost: Optional[Decimal] = None
    quantity: Optional[int] = None
    min_stock_level: Optional[int] = None
    category: Optional[str] = None
    history: Optional[str] = None
