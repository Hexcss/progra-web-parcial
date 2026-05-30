from marshmallow import Schema, fields


class UploadedFileSchema(Schema):
    url = fields.Url(required=True)
    key = fields.String(required=True)
    filename = fields.String(required=True)
    size = fields.Integer(required=True)
    mimeType = fields.String(required=True)

