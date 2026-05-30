from ...common.mongo import id_filter, now_utc, with_timestamps
from ...extensions import mongo


class ReviewRepository:
    @property
    def col(self):
        return mongo.collection("reviews")

    def find_by_id(self, review_id: str) -> dict | None:
        return self.col.find_one(id_filter(review_id))

    def find_by_product_user(self, product_id: str, user_id: str) -> dict | None:
        return self.col.find_one({"productId": product_id, "userId": user_id})

    def list(self, *, product_id=None, user_id=None, page=1, limit=20):
        query = {}
        if product_id:
            query["productId"] = product_id
        if user_id:
            query["userId"] = user_id
        total = self.col.count_documents(query)
        items = list(self.col.find(query).sort("createdAt", -1).skip((page - 1) * limit).limit(limit))
        return items, total

    def stats_for_product(self, product_id: str):
        result = list(
            self.col.aggregate(
                [
                    {"$match": {"productId": product_id}},
                    {"$group": {"_id": "$productId", "avg": {"$avg": "$score"}, "count": {"$sum": 1}}},
                ]
            )
        )
        if not result:
            return None, 0
        return round(float(result[0]["avg"]), 2), int(result[0]["count"])

    def insert(self, review: dict) -> dict:
        self.col.insert_one(with_timestamps(review))
        return review

    def update(self, review_id: str, data: dict) -> dict | None:
        data["updatedAt"] = now_utc()
        self.col.update_one(id_filter(review_id), {"$set": data})
        return self.find_by_id(review_id)

    def delete(self, review_id: str) -> None:
        self.col.delete_one(id_filter(review_id))
