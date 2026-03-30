from fastapi import Depends, HTTPException, status
from app.api.deps import get_current_user
from app.models.user import User, Role


def get_current_hr_manager_or_admin_user(
    current_user: User = Depends(get_current_user),
) -> User:
    if current_user.role not in (Role.HR_MANAGER, Role.ADMIN):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions",
        )
    return current_user
