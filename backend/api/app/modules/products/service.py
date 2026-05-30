from ...common.errors import NotFoundError
from ..discounts.repository import DiscountRepository
from ..discounts.schemas import active_discount_to_dict
from ..reviews.repository import ReviewRepository
from .repository import ProductRepository
from .schemas import product_to_dict


class ProductService:
    def __init__(self):
        self.repo = ProductRepository()
        self.reviews = ReviewRepository()
        self.discounts = DiscountRepository()

    def serialize(self, product: dict) -> dict:
        product_id = str(product["_id"])
        avg_rating, review_count = self.reviews.stats_for_product(product_id)
        active = active_discount_to_dict(self.discounts.active_for_product(product_id))
        return product_to_dict(product, avg_rating, review_count, active)

    def get_model(self, product_id: str) -> dict:
        product = self.repo.find_by_id(product_id)
        if not product:
            raise NotFoundError("Product not found")
        return product

    def get(self, product_id: str) -> dict:
        return self.serialize(self.get_model(product_id))

    def list(self, **params):
        page = params.pop("page", 1)
        limit = params.pop("limit", 20)
        items, total = self.repo.list(page=page, limit=limit, **params)
        serialized = [self.serialize(item) for item in items]
        if params.get("sort") == "rating":
            serialized.sort(key=lambda item: item.get("avgRating") or 0, reverse=True)
        return {"items": serialized, "total": total, "page": page, "limit": limit}

    def top(self, limit=10):
        return [self.serialize(item) for item in self.repo.top(limit=limit)]

    def create(self, data: dict, created_by: str | None = None) -> dict:
        product = {
            "name": data["name"],
            "description": data.get("description"),
            "price": data["price"],
            "stock": data["stock"],
            "imageUrl": data.get("imageUrl"),
            "category": data.get("category"),
            "categoryId": data.get("categoryId"),
            "tags": data.get("tags") or [],
            "createdBy": created_by,
        }
        return self.serialize(self.repo.insert(product))

    def update(self, product_id: str, data: dict) -> dict:
        self.get_model(product_id)
        updates = {}
        for field in ["name", "description", "price", "stock", "imageUrl", "category", "categoryId"]:
            if field in data:
                updates[field] = data[field]
        if "tags" in data:
            updates["tags"] = data["tags"] or []
        return self.serialize(self.repo.update(product_id, updates))

    def delete(self, product_id: str) -> None:
        self.get_model(product_id)
        self.repo.delete(product_id)

