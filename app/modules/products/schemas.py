from marshmallow import Schema, fields, validate

from ...common.serialization import iso, money


def product_to_dict(product, avg_rating=None, review_count=0, active_discount=None):
    return {
        "_id": str(product.get("_id")),
        "name": product.get("name"),
        "description": product.get("description"),
        "price": money(product.get("price")),
        "stock": int(product.get("stock", 0)),
        "imageUrl": product.get("imageUrl"),
        "category": product.get("category"),
        "categoryId": product.get("categoryId"),
        "tags": product.get("tags") or [],
        "createdBy": product.get("createdBy"),
        "createdAt": iso(product.get("createdAt")),
        "updatedAt": iso(product.get("updatedAt")),
        "avgRating": avg_rating,
        "reviewCount": review_count,
        "activeDiscount": active_discount,
    }


class ProductOutSchema(Schema):
    _id = fields.String()
    name = fields.String()
    description = fields.String(allow_none=True)
    price = fields.Float()
    stock = fields.Integer()
    imageUrl = fields.String(allow_none=True)
    category = fields.String(allow_none=True)
    categoryId = fields.String(allow_none=True)
    tags = fields.List(fields.String())
    createdBy = fields.String(allow_none=True)
    createdAt = fields.String(allow_none=True)
    updatedAt = fields.String(allow_none=True)
    avgRating = fields.Float(allow_none=True)
    reviewCount = fields.Integer()
    activeDiscount = fields.Raw(allow_none=True)


class CreateProductSchema(Schema):
    name = fields.String(required=True, validate=validate.Length(min=1))
    description = fields.String(load_default=None, allow_none=True)
    price = fields.Float(required=True, validate=validate.Range(min=0))
    stock = fields.Integer(required=True, validate=validate.Range(min=0))
    imageUrl = fields.String(load_default=None, allow_none=True)
    category = fields.String(load_default=None, allow_none=True)
    categoryId = fields.String(load_default=None, allow_none=True)
    tags = fields.List(fields.String(), load_default=list, allow_none=True)


class UpdateProductSchema(CreateProductSchema):
    pass
