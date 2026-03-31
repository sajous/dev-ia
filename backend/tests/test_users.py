from fastapi.testclient import TestClient
from sqlmodel import Session
from app.core.security import get_password_hash, create_access_token, verify_password
from app.crud.user import create_user
from app.models.user import UserCreate, Role


def make_user_and_token(session: Session, role: Role, suffix: str) -> tuple:
    hashed = get_password_hash("pass")
    user = create_user(
        session,
        UserCreate(
            username=f"user_{suffix}",
            email=f"user_{suffix}@example.com",
            role=role,
            hashed_password=hashed,
            name=f"User {suffix}",
        ),
    )
    token = create_access_token(data={"sub": str(user.id)})
    return token, user.id


def auth_header(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


class TestListUsers:
    def test_owner_can_list_users(self, client: TestClient, session: Session):
        token, _ = make_user_and_token(session, Role.OWNER, "owner1")
        response = client.get("/users", headers=auth_header(token))
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_hr_manager_can_list_users(self, client: TestClient, session: Session):
        token, _ = make_user_and_token(session, Role.HR_MANAGER, "hr1")
        response = client.get("/users", headers=auth_header(token))
        assert response.status_code == 200

    def test_admin_role_can_list_users(self, client: TestClient, session: Session):
        token, _ = make_user_and_token(session, Role.ADMIN, "admin_list")
        response = client.get("/users", headers=auth_header(token))
        assert response.status_code == 200

    def test_stock_staff_denied(self, client: TestClient, session: Session):
        token, _ = make_user_and_token(session, Role.STOCK_STAFF, "staff1")
        response = client.get("/users", headers=auth_header(token))
        assert response.status_code == 403

    def test_sales_staff_denied(self, client: TestClient, session: Session):
        token, _ = make_user_and_token(session, Role.SALES_STAFF, "sales1")
        response = client.get("/users", headers=auth_header(token))
        assert response.status_code == 403

    def test_unauthenticated_returns_401(self, client: TestClient):
        response = client.get("/users")
        assert response.status_code == 401

    def test_returns_correct_fields(self, client: TestClient, session: Session):
        token, _ = make_user_and_token(session, Role.OWNER, "owner_fields")
        response = client.get("/users", headers=auth_header(token))
        assert response.status_code == 200
        user = response.json()[0]
        assert {"id", "username", "name", "email", "role", "created_at"}.issubset(user.keys())


class TestGetUser:
    def test_owner_can_get_any_user(self, client: TestClient, session: Session):
        token, _ = make_user_and_token(session, Role.OWNER, "owner_get")
        _, target_id = make_user_and_token(session, Role.STOCK_STAFF, "target_get")
        response = client.get(f"/users/{target_id}", headers=auth_header(token))
        assert response.status_code == 200

    def test_user_can_get_own_profile(self, client: TestClient, session: Session):
        token, user_id = make_user_and_token(session, Role.STOCK_STAFF, "self_get")
        response = client.get(f"/users/{user_id}", headers=auth_header(token))
        assert response.status_code == 200

    def test_user_cannot_get_other_user(self, client: TestClient, session: Session):
        token, _ = make_user_and_token(session, Role.STOCK_STAFF, "other_get1")
        _, other_id = make_user_and_token(session, Role.SALES_STAFF, "other_get2")
        response = client.get(f"/users/{other_id}", headers=auth_header(token))
        assert response.status_code == 403

    def test_not_found_returns_404(self, client: TestClient, session: Session):
        token, _ = make_user_and_token(session, Role.OWNER, "owner_404")
        response = client.get("/users/99999", headers=auth_header(token))
        assert response.status_code == 404

    def test_unauthenticated_returns_401(self, client: TestClient):
        response = client.get("/users/1")
        assert response.status_code == 401


class TestCreateUser:
    def test_owner_can_create_user(self, client: TestClient, session: Session):
        token, _ = make_user_and_token(session, Role.OWNER, "owner_create")
        payload = {
            "username": "newstaff",
            "email": "newstaff@example.com",
            "password": "secret123",
            "name": "New Staff",
            "role": "STOCK_STAFF",
        }
        response = client.post("/users", headers=auth_header(token), json=payload)
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == "newstaff@example.com"
        assert data["role"] == "STOCK_STAFF"

    def test_hr_manager_can_create_user(self, client: TestClient, session: Session):
        token, _ = make_user_and_token(session, Role.HR_MANAGER, "hr_create")
        payload = {
            "username": "newsales",
            "email": "newsales@example.com",
            "password": "secret123",
            "role": "SALES_STAFF",
        }
        response = client.post("/users", headers=auth_header(token), json=payload)
        assert response.status_code == 201

    def test_cannot_assign_owner_role(self, client: TestClient, session: Session):
        token, _ = make_user_and_token(session, Role.OWNER, "owner_noassign")
        payload = {
            "username": "badowner",
            "email": "badowner@example.com",
            "password": "secret123",
            "role": "OWNER",
        }
        response = client.post("/users", headers=auth_header(token), json=payload)
        assert response.status_code == 400

    def test_stock_staff_cannot_create_user(self, client: TestClient, session: Session):
        token, _ = make_user_and_token(session, Role.STOCK_STAFF, "staff_create")
        payload = {
            "username": "unauthorized",
            "email": "unauthorized@example.com",
            "password": "secret123",
            "role": "STOCK_STAFF",
        }
        response = client.post("/users", headers=auth_header(token), json=payload)
        assert response.status_code == 403

    def test_password_is_hashed_on_create(self, client: TestClient, session: Session):
        from sqlmodel import select
        from app.models.user import User
        token, _ = make_user_and_token(session, Role.OWNER, "owner_hashcheck")
        payload = {
            "username": "hashtest",
            "email": "hashtest@example.com",
            "password": "plainpassword",
            "role": "STOCK_STAFF",
        }
        response = client.post("/users", headers=auth_header(token), json=payload)
        assert response.status_code == 201
        created_id = response.json()["id"]
        db_user = session.get(User, created_id)
        assert db_user.hashed_password != "plainpassword"
        assert verify_password("plainpassword", db_user.hashed_password) is True

    def test_unauthenticated_returns_401(self, client: TestClient):
        response = client.post("/users", json={"username": "x", "email": "x@x.com", "password": "x", "role": "STOCK_STAFF"})
        assert response.status_code == 401


class TestUpdateUser:
    def test_owner_can_update_any_user(self, client: TestClient, session: Session):
        token, _ = make_user_and_token(session, Role.OWNER, "owner_upd")
        _, target_id = make_user_and_token(session, Role.STOCK_STAFF, "target_upd")
        response = client.put(f"/users/{target_id}", headers=auth_header(token), json={"name": "Updated Name"})
        assert response.status_code == 200
        assert response.json()["name"] == "Updated Name"

    def test_owner_can_change_user_role(self, client: TestClient, session: Session):
        token, _ = make_user_and_token(session, Role.OWNER, "owner_role_upd")
        _, target_id = make_user_and_token(session, Role.STOCK_STAFF, "target_role_upd")
        response = client.put(f"/users/{target_id}", headers=auth_header(token), json={"role": "SALES_STAFF"})
        assert response.status_code == 200
        assert response.json()["role"] == "SALES_STAFF"

    def test_user_can_update_own_name(self, client: TestClient, session: Session):
        token, user_id = make_user_and_token(session, Role.STOCK_STAFF, "self_upd")
        response = client.put(f"/users/{user_id}", headers=auth_header(token), json={"name": "My Name"})
        assert response.status_code == 200
        assert response.json()["name"] == "My Name"

    def test_user_cannot_change_own_role(self, client: TestClient, session: Session):
        token, user_id = make_user_and_token(session, Role.STOCK_STAFF, "self_role_upd")
        response = client.put(f"/users/{user_id}", headers=auth_header(token), json={"role": "OWNER"})
        assert response.status_code == 403

    def test_user_cannot_update_other_user(self, client: TestClient, session: Session):
        token, _ = make_user_and_token(session, Role.STOCK_STAFF, "unauth_upd1")
        _, other_id = make_user_and_token(session, Role.SALES_STAFF, "unauth_upd2")
        response = client.put(f"/users/{other_id}", headers=auth_header(token), json={"name": "Hacker"})
        assert response.status_code == 403

    def test_update_not_found_returns_404(self, client: TestClient, session: Session):
        token, _ = make_user_and_token(session, Role.OWNER, "owner_upd_404")
        response = client.put("/users/99999", headers=auth_header(token), json={"name": "Ghost"})
        assert response.status_code == 404

    def test_password_is_hashed_on_update(self, client: TestClient, session: Session):
        from app.models.user import User
        token, user_id = make_user_and_token(session, Role.OWNER, "owner_pwd_upd")
        response = client.put(f"/users/{user_id}", headers=auth_header(token), json={"password": "newpassword"})
        assert response.status_code == 200
        db_user = session.get(User, user_id)
        assert verify_password("newpassword", db_user.hashed_password) is True

    def test_unauthenticated_returns_401(self, client: TestClient):
        response = client.put("/users/1", json={"name": "x"})
        assert response.status_code == 401


class TestDeleteUser:
    def test_owner_can_delete_non_admin(self, client: TestClient, session: Session):
        token, _ = make_user_and_token(session, Role.OWNER, "owner_del")
        _, target_id = make_user_and_token(session, Role.STOCK_STAFF, "target_del")
        response = client.delete(f"/users/{target_id}", headers=auth_header(token))
        assert response.status_code == 200

    def test_owner_can_delete_admin_when_others_remain(self, client: TestClient, session: Session):
        token, _ = make_user_and_token(session, Role.OWNER, "owner_del2")
        make_user_and_token(session, Role.HR_MANAGER, "extra_admin_del")
        _, target_id = make_user_and_token(session, Role.HR_MANAGER, "target_admin_del")
        response = client.delete(f"/users/{target_id}", headers=auth_header(token))
        assert response.status_code == 200

    def test_hr_manager_can_delete_non_admin(self, client: TestClient, session: Session):
        token, _ = make_user_and_token(session, Role.HR_MANAGER, "hr_del")
        make_user_and_token(session, Role.OWNER, "owner_for_hr_del")
        _, target_id = make_user_and_token(session, Role.SALES_STAFF, "target_hr_del")
        response = client.delete(f"/users/{target_id}", headers=auth_header(token))
        assert response.status_code == 200

    def test_cannot_delete_self(self, client: TestClient, session: Session):
        token, user_id = make_user_and_token(session, Role.OWNER, "self_del")
        response = client.delete(f"/users/{user_id}", headers=auth_header(token))
        assert response.status_code == 400

    def test_cannot_delete_last_admin(self, client: TestClient, session: Session):
        admin_token, _ = make_user_and_token(session, Role.ADMIN, "sys_admin_del")
        _, target_id = make_user_and_token(session, Role.HR_MANAGER, "last_hr_del")
        response = client.delete(f"/users/{target_id}", headers=auth_header(admin_token))
        assert response.status_code == 400

    def test_stock_staff_cannot_delete(self, client: TestClient, session: Session):
        token, _ = make_user_and_token(session, Role.STOCK_STAFF, "staff_del1")
        _, target_id = make_user_and_token(session, Role.SALES_STAFF, "staff_del2")
        response = client.delete(f"/users/{target_id}", headers=auth_header(token))
        assert response.status_code == 403

    def test_delete_not_found_returns_404(self, client: TestClient, session: Session):
        token, _ = make_user_and_token(session, Role.OWNER, "owner_del_404")
        response = client.delete("/users/99999", headers=auth_header(token))
        assert response.status_code == 404

    def test_unauthenticated_returns_401(self, client: TestClient):
        response = client.delete("/users/1")
        assert response.status_code == 401
