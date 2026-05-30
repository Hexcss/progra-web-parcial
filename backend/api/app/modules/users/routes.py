from flask import Blueprint, jsonify, request

from ...common.auth import auth_required, current_user_from_request, roles_required
from ...common.pagination import get_pagination
from .schemas import CreateUserSchema, UpdateProfileSchema, UpdateUserSchema
from .service import UserService

bp = Blueprint("users", __name__)
service = UserService()


@bp.get("/me")
@auth_required
def me():
    user = current_user_from_request()
    return jsonify(service.get_public(user["sub"]))


@bp.patch("/me")
@auth_required
def update_me():
    user = current_user_from_request()
    data = UpdateProfileSchema().load(request.get_json() or {}, partial=True)
    return jsonify(service.serialize(service.update(user["sub"], data)))


@bp.get("")
@roles_required("admin")
def list_users():
    page, limit = get_pagination()
    return jsonify(service.list(q=request.args.get("q"), role=request.args.get("role"), page=page, limit=limit))


@bp.get("/<user_id>")
@roles_required("admin")
def get_user(user_id):
    return jsonify(service.get_public(user_id))


@bp.post("")
@roles_required("admin")
def create_user():
    data = CreateUserSchema().load(request.get_json() or {})
    return jsonify(service.serialize(service.create(data))), 201


@bp.patch("/<user_id>")
@roles_required("admin")
def update_user(user_id):
    data = UpdateUserSchema().load(request.get_json() or {}, partial=True)
    return jsonify(service.serialize(service.update(user_id, data)))


@bp.delete("/<user_id>")
@roles_required("admin")
def delete_user(user_id):
    service.delete(user_id)
    return jsonify({"success": True})

