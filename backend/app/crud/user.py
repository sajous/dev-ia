from typing import Optional
from sqlmodel import Session, select
from app.models.user import User, UserCreate, UserUpdate


def create_user(session: Session, user: UserCreate) -> User:
    db_user = User.model_validate(user)
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user


def get_user(session: Session, user_id: int) -> Optional[User]:
    return session.get(User, user_id)


def get_user_by_email(session: Session, email: str) -> Optional[User]:
    statement = select(User).where(User.email == email)
    return session.exec(statement).first()


def get_users(session: Session, offset: int = 0, limit: int = 100) -> list[User]:
    statement = select(User).offset(offset).limit(limit)
    return list(session.exec(statement).all())


def update_user(session: Session, user_id: int, user_update: UserUpdate) -> Optional[User]:
    db_user = session.get(User, user_id)
    if not db_user:
        return None
    update_data = user_update.model_dump(exclude_unset=True)
    db_user.sqlmodel_update(update_data)
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user


def delete_user(session: Session, user_id: int) -> Optional[User]:
    db_user = session.get(User, user_id)
    if not db_user:
        return None
    session.delete(db_user)
    session.commit()
    return db_user
