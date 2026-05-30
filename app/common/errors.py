from __future__ import annotations

import uuid
from datetime import datetime, timezone

from flask import jsonify, request
from marshmallow import ValidationError
from pymongo.errors import DuplicateKeyError, PyMongoError
from werkzeug.exceptions import HTTPException


class AppError(Exception):
    status_code = 500
    message = "Internal server error"

    def __init__(self, message: str | list[str] | None = None, status_code: int | None = None):
        super().__init__(message or self.message)
        self.message = message or self.message
        if status_code is not None:
            self.status_code = status_code


class BadRequestError(AppError):
    status_code = 400
    message = "Bad request"


class UnauthorizedError(AppError):
    status_code = 401
    message = "Unauthorized"


class ForbiddenError(AppError):
    status_code = 403
    message = "Forbidden"


class NotFoundError(AppError):
    status_code = 404
    message = "Resource not found"


class ConflictError(AppError):
    status_code = 409
    message = "Conflict"


class ValidationAppError(AppError):
    status_code = 422
    message = "Validation error"


def flatten_messages(messages) -> list[str]:
    if isinstance(messages, list):
        return [str(item) for item in messages]
    if isinstance(messages, dict):
        errors: list[str] = []
        for field, value in messages.items():
            for item in flatten_messages(value):
                errors.append(f"{field}: {item}")
        return errors
    return [str(messages)]


def error_payload(status_code: int, errors) -> dict:
    return {
        "statusCode": status_code,
        "errors": flatten_messages(errors),
        "path": request.path,
        "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "requestId": str(uuid.uuid4()),
    }


def register_error_handlers(app):
    @app.errorhandler(ValidationError)
    def handle_marshmallow(error: ValidationError):
        payload = error_payload(422, error.messages)
        return jsonify(payload), 422

    @app.errorhandler(AppError)
    def handle_app_error(error: AppError):
        payload = error_payload(error.status_code, error.message)
        return jsonify(payload), error.status_code

    @app.errorhandler(DuplicateKeyError)
    def handle_duplicate(error: DuplicateKeyError):
        payload = error_payload(409, "Duplicate or conflicting resource")
        return jsonify(payload), 409

    @app.errorhandler(PyMongoError)
    def handle_mongo(error: PyMongoError):
        payload = error_payload(500, "Database error")
        return jsonify(payload), 500

    @app.errorhandler(HTTPException)
    def handle_http(error: HTTPException):
        payload = error_payload(error.code or 500, error.description or error.name)
        return jsonify(payload), error.code or 500

    @app.errorhandler(Exception)
    def handle_unexpected(error: Exception):
        app.logger.exception("Unhandled exception")
        payload = error_payload(500, "Internal server error")
        return jsonify(payload), 500
