from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select, or_
from app.api.deps import get_current_user
from app.core.security import get_password_hash
from app.crud.user import create_user, get_user, get_users, update_user, delete_user
from app.models.user import User, UserCreate, UserUpdate, Role
from app.schemas.user import UserCreateRequest, UserUpdateRequest, UserResponse
from database import get_session

router = APIRouter(prefix="/users", tags=["users"])

ADMIN_ROLES = {Role.OWNER, Role.HR_MANAGER}
PRIVILEGED_ROLES = {Role.OWNER, Role.HR_MANAGER, Role.ADMIN}
ASSIGNABLE_ROLES = {Role.STOCK_STAFF, Role.STOCK_MANAGER, Role.SALES_STAFF, Role.SALES_MANAGER, Role.HR_MANAGER}


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role not in PRIVILEGED_ROLES:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
    return current_user


def to_response(user: User) -> UserResponse:
    return UserResponse(
        id=user.id,
        username=user.username,
        name=user.name,
        email=user.email,
        role=user.role,
        created_at=user.created_at,
    )


@router.get("", response_model=List[UserResponse])
def list_users(
    session: Session = Depends(get_session),
    current_user: User = Depends(require_admin),
) -> List[UserResponse]:
    return [to_response(u) for u in get_users(session)]


@router.get("/{user_id}", response_model=UserResponse)
def get_user_detail(
    user_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> UserResponse:
    if current_user.role not in ADMIN_ROLES and current_user.id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
    user = get_user(session, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return to_response(user)


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user_endpoint(
    user_data: UserCreateRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_admin),
) -> UserResponse:
    if user_data.role == Role.OWNER:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot assign OWNER role")
    db_user = create_user(
        session,
        UserCreate(
            username=user_data.username,
            email=user_data.email,
            role=user_data.role,
            hashed_password=get_password_hash(user_data.password),
            name=user_data.name,
        ),
    )
    return to_response(db_user)


@router.put("/{user_id}", response_model=UserResponse)
def update_user_endpoint(
    user_id: int,
    user_data: UserUpdateRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> UserResponse:
    is_admin = current_user.role in ADMIN_ROLES
    if not is_admin and current_user.id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
    update_kwargs = user_data.model_dump(exclude_unset=True)
    if not is_admin and "role" in update_kwargs:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot change own role")
    if "password" in update_kwargs:
        update_kwargs["hashed_password"] = get_password_hash(update_kwargs.pop("password"))
    user = update_user(session, user_id, UserUpdate(**update_kwargs))
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return to_response(user)


@router.delete("/{user_id}", response_model=UserResponse)
def delete_user_endpoint(
    user_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_admin),
) -> UserResponse:
    if current_user.id == user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot delete own account")
    target_user = get_user(session, user_id)
    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if target_user.role in ADMIN_ROLES:
        remaining_admin_count = len(
            session.exec(
                select(User).where(
                    or_(User.role == Role.OWNER, User.role == Role.HR_MANAGER),
                    User.id != user_id,
                )
            ).all()
        )
        if remaining_admin_count < 1:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot delete the last administrator")
    deleted = delete_user(session, user_id)
    return to_response(deleted)
