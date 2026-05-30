from flask import Blueprint, jsonify, request

from ...common.auth import auth_required, current_user_from_request, roles_required
from ...common.pagination import get_pagination
from .schemas import CreateOrderSchema, UpdateOrderSchema
from .service import OrderService

bp = Blueprint("orders", __name__)
service = OrderService()


@bp.post("")
@auth_required
def create_order():
    data = CreateOrderSchema().load(request.get_json() or {})
    return jsonify(service.create(data, current_user_from_request())), 201


@bp.get("/my")
@auth_required
def my_orders():
    page, limit = get_pagination()
    user = current_user_from_request()
    return jsonify(service.list(user_id=user["sub"], page=page, limit=limit))


@bp.get("")
@roles_required("admin")
def all_orders():
    page, limit = get_pagination()
    return jsonify(service.list(page=page, limit=limit))


@bp.get("/<order_id>")
@auth_required
def get_order(order_id):
    return jsonify(service.get(order_id, current_user_from_request()))


@bp.put("/<order_id>")
@roles_required("admin")
def update_order(order_id):
    data = UpdateOrderSchema().load(request.get_json() or {})
    return jsonify(service.update_status(order_id, data))

