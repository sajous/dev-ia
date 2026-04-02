from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from sqlmodel import SQLModel, Field, Relationship


class Sale(SQLModel, table=True):
    __tablename__ = "sales"
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id")
    total_price: Decimal = Field(ge=0)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    items: List["SaleItem"] = Relationship(back_populates="sale")


class SaleItem(SQLModel, table=True):
    __tablename__ = "sale_items"
    id: Optional[int] = Field(default=None, primary_key=True)
    sale_id: int = Field(foreign_key="sales.id")
    product_id: int = Field(foreign_key="products.id")
    quantity: int = Field(ge=1)
    unit_price: Decimal = Field(ge=0)
    sale: Optional[Sale] = Relationship(back_populates="items")
