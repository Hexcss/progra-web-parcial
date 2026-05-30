from decimal import Decimal

from ...common.errors import BadRequestError, ForbiddenError, NotFoundError
from ..discounts.repository import DiscountRepository
from ..products.repository import ProductRepository
from .repository import OrderRepository
from .schemas import order_to_dict


class OrderService:
    def __init__(self):
        self.repo = OrderRepository()
        self.products = ProductRepository()
        self.discounts = DiscountRepository()

    def get_model(self, order_id: str) -> dict:
        order = self.repo.find_by_id(order_id)
        if not order:
            raise NotFoundError("Order not found")
        return order

    def list(self, *, user_id=None, page=1, limit=20):
        items, total = self.repo.list(user_id=user_id, page=page, limit=limit)
        return {"items": [order_to_dict(item) for item in items], "total": total, "page": page, "limit": limit}

    def get(self, order_id: str, current_user: dict):
        order = self.get_model(order_id)
        if current_user["role"] != "admin" and order["userId"] != current_user["sub"]:
            raise ForbiddenError("Only order owner or admin can read")
        return order_to_dict(order)

    def create(self, data: dict, current_user: dict):
        items = []
        subtotal = Decimal("0")
        for requested in data["items"]:
            product = self.products.find_by_id(requested["productId"])
            if not product:
                raise NotFoundError("Product not found")
            quantity = int(requested["quantity"])
            if int(product.get("stock", 0)) < quantity:
                raise BadRequestError(f"Insufficient stock for {product.get('name')}")
            product_id = str(product["_id"])
            active = self.discounts.active_for_product(product_id)
            discount_percent = Decimal(str(active["discountPercent"])) if active else Decimal("0")
            unit_price = Decimal(str(product["price"]))
            discounted_unit = unit_price * (Decimal("1") - (discount_percent / Decimal("100")))
            line_total = discounted_unit * quantity
            self.products.update(product_id, {"stock": int(product.get("stock", 0)) - quantity})
            subtotal += line_total
            items.append(
                {
                    "productId": product_id,
                    "name": product["name"],
                    "imageUrl": product.get("imageUrl"),
                    "unitPrice": float(unit_price),
                    "quantity": quantity,
                    "discountPercent": float(discount_percent) if active else None,
                    "lineTotal": float(line_total),
                }
            )
        order = {
            "userId": current_user["sub"],
            "email": current_user.get("email"),
            "items": items,
            "subtotal": float(subtotal),
            "total": float(subtotal),
            "currency": data.get("currency") or "USD",
            "status": "created",
        }
        return order_to_dict(self.repo.insert(order))

    def update_status(self, order_id: str, data: dict):
        self.get_model(order_id)
        return order_to_dict(self.repo.update(order_id, {"status": data["status"]}))

