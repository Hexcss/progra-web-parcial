from marshmallow import Schema, fields, post_load, validate

from ...common.serialization import iso


class UserOutSchema(Schema):
    _id = fields.Function(lambda obj: str(obj.get("_id")))
    email = fields.Email()
    displayName = fields.Function(lambda obj: obj.get("displayName"))
    role = fields.String()
    avatarUrl = fields.Function(lambda obj: obj.get("avatarUrl"))
    emailVerified = fields.Function(lambda obj: bool(obj.get("emailVerified", False)))
    createdAt = fields.Function(lambda obj: iso(obj.get("createdAt")))
    updatedAt = fields.Function(lambda obj: iso(obj.get("updatedAt")))


class CreateUserSchema(Schema):
    email = fields.Email(required=True)
    password = fields.String(required=True, validate=validate.Length(min=6))
    displayName = fields.String(load_default=None, allow_none=True)
    avatarUrl = fields.String(load_default=None, allow_none=True)
    role = fields.String(load_default="user", validate=validate.OneOf(["user", "admin", "USER", "ADMIN"]))

    @post_load
    def normalize_role(self, data, **kwargs):
        if data.get("role"):
            data["role"] = data["role"].lower()
        return data


class UpdateUserSchema(Schema):
    displayName = fields.String(allow_none=True)
    avatarUrl = fields.String(allow_none=True)
    role = fields.String(validate=validate.OneOf(["user", "admin", "USER", "ADMIN"]))

    @post_load
    def normalize_role(self, data, **kwargs):
        if data.get("role"):
            data["role"] = data["role"].lower()
        return data


class UpdateProfileSchema(Schema):
    displayName = fields.String(allow_none=True)
    avatarUrl = fields.String(allow_none=True)
