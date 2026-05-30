from marshmallow import Schema, fields, validate

from ...common.serialization import iso


def review_to_dict(review):
    user = review.get("user")
    return {
        "_id": str(review.get("_id")),
        "productId": review.get("productId"),
        "userId": review.get("userId"),
        "score": int(review.get("score", 0)),
        "comment": review.get("comment"),
        "createdAt": iso(review.get("createdAt")),
        "updatedAt": iso(review.get("updatedAt")),
        "user": None
        if user is None
        else {
            "_id": str(user.get("_id")),
            "displayName": user.get("displayName"),
            "email": user.get("email"),
            "avatarUrl": user.get("avatarUrl"),
        },
    }


class CreateReviewSchema(Schema):
    productId = fields.String(required=True)
    score = fields.Integer(required=True, validate=validate.Range(min=1, max=5))
    comment = fields.String(load_default=None, allow_none=True)


class UpdateReviewSchema(Schema):
    productId = fields.String()
    score = fields.Integer(validate=validate.Range(min=1, max=5))
    comment = fields.String(allow_none=True)
