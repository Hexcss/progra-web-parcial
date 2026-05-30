from ...common.errors import ConflictError, NotFoundError
from ...common.security import hash_password, normalize_email
from .repository import UserRepository
from .schemas import UserOutSchema


class UserService:
    def __init__(self, repo: UserRepository | None = None):
        self.repo = repo or UserRepository()
        self.out = UserOutSchema()

    def serialize(self, user: dict) -> dict:
        return self.out.dump(user)

    def get(self, user_id: str) -> dict:
        user = self.repo.find_by_id(user_id)
        if not user:
            raise NotFoundError("User not found")
        return user

    def get_public(self, user_id: str) -> dict:
        return self.serialize(self.get(user_id))

    def list(self, *, q=None, role=None, page=1, limit=20):
        items, total = self.repo.list(q=q, role=role, page=page, limit=limit)
        return {"items": [self.serialize(item) for item in items], "total": total, "page": page, "limit": limit}

    def create(self, data: dict, *, default_role: str = "user") -> dict:
        email = normalize_email(data["email"])
        if self.repo.find_by_email(email):
            raise ConflictError("Email already exists")
        user = {
            "email": email,
            "passwordHash": hash_password(data["password"]),
            "role": data.get("role") or default_role,
            "displayName": data.get("displayName"),
            "avatarUrl": data.get("avatarUrl"),
            "emailVerified": False,
        }
        return self.repo.insert(user)

    def update(self, user_id: str, data: dict) -> dict:
        self.get(user_id)
        updates = {}
        if "displayName" in data:
            updates["displayName"] = data["displayName"]
        if "avatarUrl" in data:
            updates["avatarUrl"] = data["avatarUrl"]
        if "role" in data:
            updates["role"] = data["role"]
        return self.repo.update(user_id, updates)

    def delete(self, user_id: str) -> None:
        self.get(user_id)
        self.repo.delete(user_id)

