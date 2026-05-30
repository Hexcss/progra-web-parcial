from flask import Blueprint, jsonify, request

from ...common.auth import current_user_from_request, roles_required
from ...common.pagination import get_pagination
from .schemas import CreateProductSchema, UpdateProductSchema
from .service import ProductService

bp = Blueprint("products", __name__)
service = ProductService()


@bp.get("")
def list_products():
    page, limit = get_pagination()
    tags = request.args.getlist("tags")
    return jsonify(
        service.list(
            q=request.args.get("q"),
            category=request.args.get("category"),
            category_id=request.args.get("categoryId"),
            tags=tags or None,
            min_price=request.args.get("minPrice", type=float),
            max_price=request.args.get("maxPrice", type=float),
            sort=request.args.get("sort"),
            page=page,
            limit=limit,
        )
    )


@bp.get("/top")
def top_products():
    return jsonify(service.top(limit=max(min(request.args.get("limit", 10, type=int), 100), 1)))


@bp.get("/<product_id>")
def get_product(product_id):
    return jsonify(service.get(product_id))


@bp.post("")
@roles_required("admin")
def create_product():
    data = CreateProductSchema().load(request.get_json() or {})
    user = current_user_from_request()
    return jsonify(service.create(data, created_by=user["sub"])), 201


@bp.put("/<product_id>")
@roles_required("admin")
def update_product(product_id):
    data = UpdateProductSchema().load(request.get_json() or {}, partial=True)
    return jsonify(service.update(product_id, data))


@bp.delete("/<product_id>")
@roles_required("admin")
def delete_product(product_id):
    service.delete(product_id)
    return jsonify({"success": True})

