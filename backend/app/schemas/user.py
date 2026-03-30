from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class UserRead(BaseModel):
    id: int
    name: Optional[str]
    email: str
    role: str
    created_at: Optional[datetime]
