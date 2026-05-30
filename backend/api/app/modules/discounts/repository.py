from datetime import datetime, timezone

from ...common.mongo import id_filter, now_utc, with_timestamps
from ...extensions import mongo


class DiscountRepository:
    @property
    def col(self):
        return mongo.collection("discounts")

    def find_by_id(self, discount_id: str) -> dict | None:
        return self.col.find_one(id_filter(discount_id))

    def list(self, *, product_id=None, page=1, limit=20):
        query = {}
        if product_id:
            query["productId"] = product_id
        total = self.col.count_documents(query)
        items = list(self.col.find(query).sort("startDate", -1).skip((page - 1) * limit).limit(limit))
        return items, total

    def active_for_product(self, product_id: str) -> dict | None:
        now = datetime.now(timezone.utc)
        return self.col.find_one(
            {"productId": product_id, "startDate": {"$lte": now}, "endDate": {"$gte": now}},
            sort=[("discountPercent", -1)],
        )

    def insert(self, discount: dict) -> dict:
        self.col.insert_one(with_timestamps(discount))
        return discount

    def update(self, discount_id: str, data: dict) -> dict | None:
        data["updatedAt"] = now_utc()
        self.col.update_one(id_filter(discount_id), {"$set": data})
        return self.find_by_id(discount_id)

    def delete(self, discount_id: str) -> None:
        self.col.delete_one(id_filter(discount_id))
