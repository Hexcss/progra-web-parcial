from flask import Blueprint, jsonify, request

from ...common.auth import roles_required
from ...common.pagination import get_pagination
from .schemas import CreateDiscountSchema, UpdateDiscountSchema
from .service import DiscountService

bp = Blueprint("discounts", __name__)
service = DiscountService()


@bp.get("")
def list_discounts():
    page, limit = get_pagination()
    result = service.list(product_id=request.args.get("productId"), page=page, limit=limit)
    if "page" not in request.args and "limit" not in request.args:
        return jsonify(result["items"])
    return jsonify(result)


@bp.get("/<discount_id>")
def get_discount(discount_id):
    return jsonify(service.get(discount_id))


@bp.post("")
@roles_required("admin")
def create_discount():
    data = CreateDiscountSchema().load(request.get_json() or {})
    return jsonify(service.create(data)), 201


@bp.put("/<discount_id>")
@roles_required("admin")
def update_discount(discount_id):
    data = UpdateDiscountSchema().load(request.get_json() or {}, partial=True)
    return jsonify(service.update(discount_id, data))


@bp.delete("/<discount_id>")
@roles_required("admin")
def delete_discount(discount_id):
    service.delete(discount_id)
    return jsonify({"success": True})

