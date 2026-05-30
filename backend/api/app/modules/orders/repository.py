from ...common.mongo import id_filter, now_utc, with_timestamps
from ...extensions import mongo


class OrderRepository:
    @property
    def col(self):
        return mongo.collection("orders")

    def find_by_id(self, order_id: str) -> dict | None:
        return self.col.find_one(id_filter(order_id))

    def list(self, *, user_id=None, page=1, limit=20):
        query = {}
        if user_id:
            query["userId"] = user_id
        total = self.col.count_documents(query)
        items = list(self.col.find(query).sort("createdAt", -1).skip((page - 1) * limit).limit(limit))
        return items, total

    def insert(self, order: dict) -> dict:
        self.col.insert_one(with_timestamps(order))
        return order

    def update(self, order_id: str, data: dict) -> dict | None:
        data["updatedAt"] = now_utc()
        self.col.update_one(id_filter(order_id), {"$set": data})
        return self.find_by_id(order_id)
