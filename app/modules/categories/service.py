from ...common.errors import ConflictError, NotFoundError
from ..products.repository import ProductRepository
from .repository import CategoryRepository
from .schemas import category_to_dict


class CategoryService:
    def __init__(self):
        self.repo = CategoryRepository()
        self.products = ProductRepository()

    def serialize(self, category: dict, enriched=True):
        if not enriched:
            return category_to_dict(category)
        category_id = str(category["_id"])
        return category_to_dict(
            category,
            product_count=self.products.count_by_category(category_id),
            thumbnail=self.products.thumbnail_by_category(category_id),
        )

    def list(self):
        return [self.serialize(item) for item in self.repo.list()]

    def get_model(self, category_id: str) -> dict:
        category = self.repo.find_by_id(category_id)
        if not category:
            raise NotFoundError("Category not found")
        return category

    def get(self, category_id: str):
        return self.serialize(self.get_model(category_id))

    def thumbnail(self, category_id: str):
        self.get_model(category_id)
        return {"categoryId": category_id, "thumbnail": self.products.thumbnail_by_category(category_id)}

    def create(self, data: dict):
        if self.repo.find_by_name(data["name"]):
            raise ConflictError("Category already exists")
        return self.serialize(self.repo.insert({"name": data["name"], "icon": data["icon"]}), enriched=False)

    def update(self, category_id: str, data: dict):
        category = self.get_model(category_id)
        if "name" in data and data["name"] != category.get("name") and self.repo.find_by_name(data["name"]):
            raise ConflictError("Category already exists")
        updates = {}
        if "name" in data:
            updates["name"] = data["name"]
        if "icon" in data:
            updates["icon"] = data["icon"]
        return self.serialize(self.repo.update(category_id, updates), enriched=False)

    def delete(self, category_id: str) -> None:
        self.get_model(category_id)
        self.repo.delete(category_id)

