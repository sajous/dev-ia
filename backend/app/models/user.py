from datetime import datetime
from enum import Enum
from typing import Optional
from sqlmodel import SQLModel, Field


class Role(str, Enum):
    ADMIN = "ADMIN"
    STOCK_STAFF = "STOCK_STAFF"
    STOCK_MANAGER = "STOCK_MANAGER"
    SALES_STAFF = "SALES_STAFF"
    SALES_MANAGER = "SALES_MANAGER"
    HR_MANAGER = "HR_MANAGER"
    CUSTOMER = "CUSTOMER"


class UserBase(SQLModel):
    username: str = Field(unique=True, index=True)
    email: str = Field(unique=True, index=True)
    role: Role
    name: Optional[str] = Field(default=None)


class User(UserBase, table=True):
    __tablename__ = "users"
    id: Optional[int] = Field(default=None, primary_key=True)
    hashed_password: str
    created_at: Optional[datetime] = Field(default_factory=datetime.utcnow)


class UserCreate(UserBase):
    hashed_password: str


class UserUpdate(SQLModel):
    username: Optional[str] = None
    email: Optional[str] = None
    role: Optional[Role] = None
    hashed_password: Optional[str] = None
    name: Optional[str] = None
