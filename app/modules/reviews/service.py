from ...common.errors import ConflictError, ForbiddenError, NotFoundError
from ..products.repository import ProductRepository
from ..users.repository import UserRepository
from .repository import ReviewRepository
from .schemas import review_to_dict


class ReviewService:
    def __init__(self):
        self.repo = ReviewRepository()
        self.products = ProductRepository()
        self.users = UserRepository()

    def get_model(self, review_id: str) -> dict:
        review = self.repo.find_by_id(review_id)
        if not review:
            raise NotFoundError("Review not found")
        return review

    def _attach_user(self, review: dict) -> dict:
        review["user"] = self.users.find_by_id(review["userId"])
        return review

    def list(self, *, product_id=None, user_id=None, page=1, limit=20):
        items, total = self.repo.list(product_id=product_id, user_id=user_id, page=page, limit=limit)
        return {"items": [review_to_dict(self._attach_user(item)) for item in items], "total": total, "page": page, "limit": limit}

    def get(self, review_id: str):
        return review_to_dict(self._attach_user(self.get_model(review_id)))

    def create(self, data: dict, user_id: str):
        if not self.products.find_by_id(data["productId"]):
            raise NotFoundError("Product not found")
        if self.repo.find_by_product_user(data["productId"], user_id):
            raise ConflictError("User already reviewed this product")
        review = {"productId": data["productId"], "userId": user_id, "score": data["score"], "comment": data.get("comment")}
        return review_to_dict(self._attach_user(self.repo.insert(review)))

    def update(self, review_id: str, data: dict, current_user: dict):
        review = self.get_model(review_id)
        if current_user["role"] != "admin" and review["userId"] != current_user["sub"]:
            raise ForbiddenError("Only review owner or admin can update")
        updates = {}
        for field in ["productId", "score", "comment"]:
            if field in data:
                updates[field] = data[field]
        return review_to_dict(self._attach_user(self.repo.update(review_id, updates)))

    def delete(self, review_id: str, current_user: dict) -> None:
        review = self.get_model(review_id)
        if current_user["role"] != "admin" and review["userId"] != current_user["sub"]:
            raise ForbiddenError("Only review owner or admin can delete")
        self.repo.delete(review_id)

