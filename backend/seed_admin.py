import logging
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlmodel import Session, select, or_
from app.core.security import get_password_hash
from app.crud.user import create_user
from app.models.user import User, UserCreate, Role
from database import engine, create_db_and_tables

logging.basicConfig(level=logging.INFO, format="%(levelname)s:%(name)s:%(message)s")
logger = logging.getLogger(__name__)


def seed_admin_in_session(session: Session) -> bool:
    existing = session.exec(
        select(User).where(or_(User.role == Role.OWNER, User.role == Role.HR_MANAGER))
    ).first()
    if existing:
        logger.info("Administrative user already exists. Skipping seed.")
        return False
    admin = create_user(
        session,
        UserCreate(
            username="admin",
            email="admin@sistema.com",
            role=Role.OWNER,
            hashed_password=get_password_hash("admin123"),
            name="Super Admin",
        ),
    )
    logger.info("Created admin user id=%s role=%s", admin.id, admin.role)
    return True


def seed_admin() -> None:
    create_db_and_tables()
    with Session(engine) as session:
        seed_admin_in_session(session)


if __name__ == "__main__":
    seed_admin()
