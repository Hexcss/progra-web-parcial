from flask import Blueprint, jsonify, request

from ...common.auth import roles_required
from .schemas import CreateCategorySchema, UpdateCategorySchema
from .service import CategoryService

bp = Blueprint("categories", __name__)
service = CategoryService()


@bp.get("")
def list_categories():
    return jsonify(service.list())


@bp.get("/<category_id>")
def get_category(category_id):
    return jsonify(service.get(category_id))


@bp.get("/<category_id>/thumbnail")
def get_thumbnail(category_id):
    return jsonify(service.thumbnail(category_id))


@bp.post("")
@roles_required("admin")
def create_category():
    data = CreateCategorySchema().load(request.get_json() or {})
    return jsonify(service.create(data)), 201


@bp.put("/<category_id>")
@roles_required("admin")
def update_category(category_id):
    data = UpdateCategorySchema().load(request.get_json() or {}, partial=True)
    return jsonify(service.update(category_id, data))


@bp.delete("/<category_id>")
@roles_required("admin")
def delete_category(category_id):
    service.delete(category_id)
    return jsonify({"success": True})

