from enum import Enum
from typing import Optional
from sqlmodel import SQLModel, Field


class Role(str, Enum):
    STOCK_STAFF = "STOCK_STAFF"
    STOCK_MANAGER = "STOCK_MANAGER"
    SALES_STAFF = "SALES_STAFF"
    SALES_MANAGER = "SALES_MANAGER"
    HR_MANAGER = "HR_MANAGER"


class UserBase(SQLModel):
    username: str = Field(unique=True, index=True)
    email: str = Field(unique=True, index=True)
    role: Role


class User(UserBase, table=True):
    __tablename__ = "users"
    id: Optional[int] = Field(default=None, primary_key=True)
    hashed_password: str


class UserCreate(UserBase):
    hashed_password: str


class UserUpdate(SQLModel):
    username: Optional[str] = None
    email: Optional[str] = None
    role: Optional[Role] = None
    hashed_password: Optional[str] = None
