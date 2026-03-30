from typing import List
from fastapi import APIRouter, Depends
from sqlmodel import Session
from app.crud.user import get_users
from app.dependencies.auth import get_current_hr_manager_or_admin_user
from app.schemas.user import UserRead
from database import get_session

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/users", response_model=List[UserRead])
def list_users(
    session: Session = Depends(get_session),
    _: object = Depends(get_current_hr_manager_or_admin_user),
) -> List[UserRead]:
    users = get_users(session)
    return [
        UserRead(
            id=u.id,
            name=u.name,
            email=u.email,
            role=u.role,
            created_at=u.created_at,
        )
        for u in users
    ]
