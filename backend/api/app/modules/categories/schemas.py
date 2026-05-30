from marshmallow import Schema, fields, validate

from ...common.serialization import iso


def category_to_dict(category, product_count=None, thumbnail=None):
    return {
        "_id": str(category.get("_id")),
        "name": category.get("name"),
        "icon": category.get("icon"),
        "createdAt": iso(category.get("createdAt")),
        "updatedAt": iso(category.get("updatedAt")),
        "productCount": product_count,
        "thumbnail": thumbnail,
    }


class CreateCategorySchema(Schema):
    name = fields.String(required=True, validate=validate.Length(min=1))
    icon = fields.String(required=True, validate=validate.Length(min=1))


class UpdateCategorySchema(Schema):
    name = fields.String(validate=validate.Length(min=1))
    icon = fields.String(validate=validate.Length(min=1))
