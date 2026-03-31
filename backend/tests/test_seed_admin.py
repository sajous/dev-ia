from unittest.mock import patch, MagicMock
from sqlmodel import Session, select
from app.core.security import verify_password
from app.models.user import User, Role
from seed_admin import seed_admin_in_session, seed_admin


def test_seed_creates_admin_when_none_exists(session: Session):
    result = seed_admin_in_session(session)
    assert result is True
    user = session.exec(select(User).where(User.email == "admin@sistema.com")).first()
    assert user is not None


def test_seed_admin_has_owner_role(session: Session):
    seed_admin_in_session(session)
    user = session.exec(select(User).where(User.email == "admin@sistema.com")).first()
    assert user.role == Role.OWNER


def test_seed_admin_password_is_hashed(session: Session):
    seed_admin_in_session(session)
    user = session.exec(select(User).where(User.email == "admin@sistema.com")).first()
    assert user.hashed_password != "admin123"
    assert verify_password("admin123", user.hashed_password) is True


def test_seed_is_idempotent(session: Session):
    seed_admin_in_session(session)
    result = seed_admin_in_session(session)
    assert result is False
    all_users = session.exec(select(User)).all()
    assert len(all_users) == 1


def test_seed_admin_orchestrates_db_and_session():
    mock_session = MagicMock()
    with patch('seed_admin.create_db_and_tables') as mock_create, \
         patch('seed_admin.seed_admin_in_session') as mock_seed, \
         patch('seed_admin.Session') as mock_session_cls:
        mock_session_cls.return_value.__enter__ = MagicMock(return_value=mock_session)
        mock_session_cls.return_value.__exit__ = MagicMock(return_value=False)
        seed_admin()
        mock_create.assert_called_once()
        mock_seed.assert_called_once_with(mock_session)


def test_seed_main_block():
    with patch('seed_admin.seed_admin_in_session', return_value=False), \
         patch('seed_admin.create_db_and_tables'):
        import runpy
        runpy.run_module('seed_admin', run_name='__main__', alter_sys=True)


def test_seed_skips_when_hr_manager_exists(session: Session):
    from app.core.security import get_password_hash
    from app.crud.user import create_user
    from app.models.user import UserCreate
    create_user(
        session,
        UserCreate(
            username="hrmanager",
            email="hr@example.com",
            role=Role.HR_MANAGER,
            hashed_password=get_password_hash("pass"),
        ),
    )
    result = seed_admin_in_session(session)
    assert result is False
    all_users = session.exec(select(User)).all()
    assert len(all_users) == 1
