from flask_jwt_extended import create_access_token

from ...common.auth import create_tokens
from ...common.errors import UnauthorizedError
from ...common.security import normalize_email, verify_password
from ..users.repository import UserRepository
from ..users.schemas import UserOutSchema
from ..users.service import UserService


class AuthService:
    def __init__(self):
        self.user_repo = UserRepository()
        self.user_service = UserService(self.user_repo)
        self.user_out = UserOutSchema()

    def register(self, data: dict):
        user = self.user_service.create(data, default_role="user")
        return user, create_tokens(user)

    def login(self, data: dict):
        user = self.user_repo.find_by_email(normalize_email(data["email"]))
        if not user or not verify_password(user["passwordHash"], data["password"]):
            raise UnauthorizedError("Invalid credentials")
        return user, create_tokens(user)

    def session_payload(self, user_claims: dict):
        return {"sub": user_claims["sub"], "email": user_claims["email"], "role": user_claims["role"]}

    def ws_ticket(self, user_claims: dict) -> str:
        return create_access_token(
            identity=user_claims["sub"],
            additional_claims={"email": user_claims["email"], "role": user_claims["role"], "scope": "ws"},
        )

    @staticmethod
    def verification_email_status():
        return {"attempted": False, "sent": False, "id": None, "error": None}
