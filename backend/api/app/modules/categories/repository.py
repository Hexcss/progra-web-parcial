from ...common.mongo import id_filter, now_utc, with_timestamps
from ...extensions import mongo


class CategoryRepository:
    @property
    def col(self):
        return mongo.collection("categories")

    def find_by_id(self, category_id: str) -> dict | None:
        return self.col.find_one(id_filter(category_id))

    def find_by_name(self, name: str) -> dict | None:
        return self.col.find_one({"name": name})

    def list(self):
        return list(self.col.find({}).sort("name", 1))

    def insert(self, category: dict) -> dict:
        self.col.insert_one(with_timestamps(category))
        return category

    def update(self, category_id: str, data: dict) -> dict | None:
        data["updatedAt"] = now_utc()
        self.col.update_one(id_filter(category_id), {"$set": data})
        return self.find_by_id(category_id)

    def delete(self, category_id: str) -> None:
        self.col.delete_one(id_filter(category_id))
