from marshmallow import Schema, fields, validates_schema, ValidationError, validate

from ...common.serialization import iso, money


def discount_to_dict(discount):
    return {
        "_id": str(discount.get("_id")),
        "productId": discount.get("productId"),
        "discountPercent": money(discount.get("discountPercent")),
        "startDate": iso(discount.get("startDate")),
        "endDate": iso(discount.get("endDate")),
        "createdAt": iso(discount.get("createdAt")),
        "updatedAt": iso(discount.get("updatedAt")),
    }


def active_discount_to_dict(discount):
    if not discount:
        return None
    return {
        "discountPercent": money(discount.get("discountPercent")),
        "startDate": iso(discount.get("startDate")),
        "endDate": iso(discount.get("endDate")),
    }


class CreateDiscountSchema(Schema):
    productId = fields.String(required=True)
    discountPercent = fields.Float(required=True, validate=validate.Range(min=0, max=100))
    startDate = fields.DateTime(required=True)
    endDate = fields.DateTime(required=True)

    @validates_schema
    def validate_dates(self, data, **kwargs):
        if data["endDate"] < data["startDate"]:
            raise ValidationError("endDate must be greater than or equal to startDate", field_name="endDate")


class UpdateDiscountSchema(CreateDiscountSchema):
    pass
