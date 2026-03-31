from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.models.user import Role


class UserRead(BaseModel):
    id: int
    name: Optional[str]
    email: str
    role: str
    created_at: Optional[datetime]


class UserCreateRequest(BaseModel):
    username: str
    email: str
    password: str
    name: Optional[str] = None
    role: Role


class UserUpdateRequest(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    name: Optional[str] = None
    role: Optional[Role] = None
    password: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    username: str
    name: Optional[str]
    email: str
    role: str
    created_at: Optional[datetime]
