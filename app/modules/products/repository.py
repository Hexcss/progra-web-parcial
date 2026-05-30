from ...common.mongo import id_filter, now_utc, with_timestamps
from ...extensions import mongo


class ProductRepository:
    @property
    def col(self):
        return mongo.collection("products")

    def find_by_id(self, product_id: str) -> dict | None:
        return self.col.find_one(id_filter(product_id))

    def list(self, *, q=None, category=None, category_id=None, tags=None, min_price=None, max_price=None, sort=None, page=1, limit=20):
        query = {}
        if q:
            query["name"] = {"$regex": q, "$options": "i"}
        if category:
            query["category"] = category
        if category_id:
            query["categoryId"] = category_id
        if min_price is not None:
            query.setdefault("price", {})["$gte"] = min_price
        if max_price is not None:
            query.setdefault("price", {})["$lte"] = max_price
        if tags:
            query["tags"] = {"$all": tags}
        if sort == "priceAsc":
            sort_by = [("price", 1)]
        elif sort == "priceDesc":
            sort_by = [("price", -1)]
        else:
            sort_by = [("createdAt", -1)]
        total = self.col.count_documents(query)
        return list(self.col.find(query).sort(sort_by).skip((page - 1) * limit).limit(limit)), total

    def top(self, limit=10):
        return list(self.col.find({}).sort("createdAt", -1).limit(limit))

    def count_by_category(self, category_id: str) -> int:
        return self.col.count_documents({"categoryId": category_id})

    def thumbnail_by_category(self, category_id: str) -> str | None:
        row = self.col.find_one({"categoryId": category_id, "imageUrl": {"$ne": None}})
        return row.get("imageUrl") if row else None

    def insert(self, product: dict) -> dict:
        self.col.insert_one(with_timestamps(product))
        return product

    def update(self, product_id: str, data: dict) -> dict | None:
        data["updatedAt"] = now_utc()
        self.col.update_one(id_filter(product_id), {"$set": data})
        return self.find_by_id(product_id)

    def delete(self, product_id: str) -> None:
        self.col.delete_one(id_filter(product_id))
