from ...common.errors import NotFoundError
from ..products.repository import ProductRepository
from .repository import DiscountRepository
from .schemas import discount_to_dict


class DiscountService:
    def __init__(self):
        self.repo = DiscountRepository()
        self.products = ProductRepository()

    def get_model(self, discount_id: str) -> dict:
        discount = self.repo.find_by_id(discount_id)
        if not discount:
            raise NotFoundError("Discount not found")
        return discount

    def list(self, *, product_id=None, page=1, limit=20):
        items, total = self.repo.list(product_id=product_id, page=page, limit=limit)
        return {"items": [discount_to_dict(item) for item in items], "total": total, "page": page, "limit": limit}

    def get(self, discount_id: str):
        return discount_to_dict(self.get_model(discount_id))

    def create(self, data: dict):
        if not self.products.find_by_id(data["productId"]):
            raise NotFoundError("Product not found")
        discount = {
            "productId": data["productId"],
            "discountPercent": data["discountPercent"],
            "startDate": data["startDate"],
            "endDate": data["endDate"],
        }
        return discount_to_dict(self.repo.insert(discount))

    def update(self, discount_id: str, data: dict):
        self.get_model(discount_id)
        updates = {}
        for field in ["productId", "discountPercent", "startDate", "endDate"]:
            if field in data:
                updates[field] = data[field]
        return discount_to_dict(self.repo.update(discount_id, updates))

    def delete(self, discount_id: str) -> None:
        self.get_model(discount_id)
        self.repo.delete(discount_id)

