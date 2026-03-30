from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session
from app.schemas.auth import LoginSchema, TokenSchema
from app.core.security import verify_password, create_access_token
from app.crud.user import get_user_by_email
from database import get_session

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenSchema)
def login(credentials: LoginSchema, session: Session = Depends(get_session)):
    user = get_user_by_email(session, credentials.email)
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": str(user.id)})
    return TokenSchema(access_token=access_token, token_type="bearer")
