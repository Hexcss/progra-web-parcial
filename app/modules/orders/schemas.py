from marshmallow import Schema, fields, validate

from ...common.serialization import iso, money


def order_to_dict(order):
    return {
        "_id": str(order.get("_id")),
        "userId": order.get("userId"),
        "email": order.get("email"),
        "items": [
            {
                "productId": item.get("productId"),
                "name": item.get("name"),
                "imageUrl": item.get("imageUrl"),
                "unitPrice": money(item.get("unitPrice")),
                "quantity": int(item.get("quantity")),
                "discountPercent": money(item.get("discountPercent")) if item.get("discountPercent") is not None else None,
                "lineTotal": money(item.get("lineTotal")),
            }
            for item in order.get("items", [])
        ],
        "subtotal": money(order.get("subtotal")),
        "total": money(order.get("total")),
        "currency": order.get("currency"),
        "status": order.get("status"),
        "createdAt": iso(order.get("createdAt")),
        "updatedAt": iso(order.get("updatedAt")),
        "emailStatus": order.get("emailStatus"),
    }


class CreateOrderItemSchema(Schema):
    productId = fields.String(required=True)
    quantity = fields.Integer(required=True, validate=validate.Range(min=1))


class CreateOrderSchema(Schema):
    items = fields.List(fields.Nested(CreateOrderItemSchema), required=True, validate=validate.Length(min=1))
    currency = fields.String(load_default="USD", allow_none=True)


class UpdateOrderSchema(Schema):
    status = fields.String(required=True, validate=validate.Length(min=1))
