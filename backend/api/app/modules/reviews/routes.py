from flask import Blueprint, jsonify, request

from ...common.auth import auth_required, current_user_from_request
from ...common.pagination import get_pagination
from .schemas import CreateReviewSchema, UpdateReviewSchema
from .service import ReviewService

bp = Blueprint("reviews", __name__)
service = ReviewService()


@bp.get("")
def list_reviews():
    page, limit = get_pagination()
    return jsonify(service.list(product_id=request.args.get("productId"), user_id=request.args.get("userId"), page=page, limit=limit))


@bp.get("/<review_id>")
def get_review(review_id):
    return jsonify(service.get(review_id))


@bp.post("")
@auth_required
def create_review():
    data = CreateReviewSchema().load(request.get_json() or {})
    user = current_user_from_request()
    return jsonify(service.create(data, user["sub"])), 201


@bp.put("/<review_id>")
@auth_required
def update_review(review_id):
    data = UpdateReviewSchema().load(request.get_json() or {}, partial=True)
    return jsonify(service.update(review_id, data, current_user_from_request()))


@bp.delete("/<review_id>")
@auth_required
def delete_review(review_id):
    service.delete(review_id, current_user_from_request())
    return jsonify({"success": True})

