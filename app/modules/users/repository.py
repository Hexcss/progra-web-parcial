from ...common.mongo import id_filter, now_utc, with_timestamps
from ...extensions import mongo


class UserRepository:
    @property
    def col(self):
        return mongo.collection("users")

    def find_by_id(self, user_id: str) -> dict | None:
        return self.col.find_one(id_filter(user_id))

    def find_by_email(self, email: str) -> dict | None:
        return self.col.find_one({"email": email})

    def list(self, *, q=None, role=None, page=1, limit=20):
        query = {}
        if q:
            query["$or"] = [{"email": {"$regex": q, "$options": "i"}}, {"displayName": {"$regex": q, "$options": "i"}}]
        if role:
            query["role"] = role.lower()
        total = self.col.count_documents(query)
        items = list(self.col.find(query).sort("createdAt", -1).skip((page - 1) * limit).limit(limit))
        return items, total

    def insert(self, user: dict) -> dict:
        self.col.insert_one(with_timestamps(user))
        return user

    def update(self, user_id: str, data: dict) -> dict | None:
        data["updatedAt"] = now_utc()
        self.col.update_one(id_filter(user_id), {"$set": data})
        return self.find_by_id(user_id)

    def delete(self, user_id: str) -> None:
        self.col.delete_one(id_filter(user_id))
