import json
import re

from flask import Blueprint, jsonify, request

from ...common.auth import clear_auth_cookies, current_user_from_request, require_role, set_auth_cookies
from ...common.errors import BadRequestError
from ...common.storage import FileStorageService
from ..auth.schemas import LoginSchema, RegisterSchema
from ..auth.service import AuthService
from ..categories.schemas import CreateCategorySchema, UpdateCategorySchema
from ..categories.service import CategoryService
from ..discounts.schemas import CreateDiscountSchema, UpdateDiscountSchema
from ..discounts.service import DiscountService
from ..orders.schemas import CreateOrderSchema, UpdateOrderSchema
from ..orders.service import OrderService
from ..products.schemas import CreateProductSchema, UpdateProductSchema
from ..products.service import ProductService
from ..reviews.schemas import CreateReviewSchema, UpdateReviewSchema
from ..reviews.service import ReviewService
from ..users.schemas import CreateUserSchema, UpdateProfileSchema, UpdateUserSchema, UserOutSchema
from ..users.service import UserService

bp = Blueprint("graphql", __name__)

auth_service = AuthService()
users = UserService()
products = ProductService()
categories = CategoryService()
discounts = DiscountService()
reviews = ReviewService()
orders = OrderService()
user_out = UserOutSchema()


def _op(query: str) -> str:
    match = re.search(r"\b(?:query|mutation)\s+([A-Za-z0-9_]+)", query)
    if match:
        return match.group(1)
    for name in [
        "Register",
        "Login",
        "Logout",
        "Session",
        "WsTicket",
        "Me",
        "UpdateProfile",
        "Users",
        "User",
        "CreateUser",
        "UpdateUser",
        "RemoveUser",
        "Products",
        "Product",
        "TopProducts",
        "CreateProduct",
        "UpdateProduct",
        "RemoveProduct",
        "Categories",
        "CategoryThumbnail",
        "Category",
        "CreateCategory",
        "UpdateCategory",
        "RemoveCategory",
        "Discounts",
        "Discount",
        "CreateDiscount",
        "UpdateDiscount",
        "RemoveDiscount",
        "Reviews",
        "Review",
        "CreateReview",
        "UpdateReview",
        "RemoveReview",
        "CreateOrder",
        "MyOrders",
        "Orders",
        "Order",
        "UpdateOrderStatus",
        "DeleteFile",
        "FileName",
    ]:
        if f" {name}" in query or f"{name}(" in query:
            return name
    raise BadRequestError("Unsupported GraphQL operation")


@bp.post("")
@bp.post("/")
def graphql():
    if request.content_type and request.content_type.startswith("multipart/form-data"):
        return _graphql_upload()

    body = request.get_json() or {}
    query = body.get("query") or ""
    variables = body.get("variables") or {}
    name = _op(query)
    payload = _execute(name, variables)
    tokens = payload.pop("__tokens", None) if isinstance(payload, dict) else None
    should_clear = payload.pop("__clear", False) if isinstance(payload, dict) else False
    response = jsonify({"data": payload})
    if tokens:
        set_auth_cookies(response, tokens[0], tokens[1])
    if should_clear:
        clear_auth_cookies(response)
    return response


def _graphql_upload():
    operations = json.loads(request.form.get("operations") or "{}")
    variables = operations.get("variables") or {}
    file = request.files.get("0")
    if not file:
        raise BadRequestError("File is required")
    user = current_user_from_request(required=True)
    return jsonify({"data": {"uploadFile": FileStorageService().upload(file, user_id=user["sub"], folder=variables.get("folder"))}})


def _execute(name: str, variables: dict):
    if name == "Register":
        user, tokens = auth_service.register(RegisterSchema().load(variables.get("input") or {}))
        verification = auth_service.maybe_send_email_verification(user, _server_origin())
        return {"register": {"user": user_out.dump(user), "verificationEmail": verification}, "__tokens": tokens}
    if name == "Login":
        user, tokens = auth_service.login(LoginSchema().load(variables.get("input") or {}))
        return {"login": {"user": user_out.dump(user)}, "__tokens": tokens}
    if name == "Logout":
        current_user_from_request(required=True)
        return {"logout": {"success": True}, "__clear": True}
    if name == "Session":
        user = current_user_from_request(required=True)
        return {"session": auth_service.session_payload(user)}
    if name == "WsTicket":
        return {"wsTicket": auth_service.ws_ticket(current_user_from_request(required=True))}

    if name == "Me":
        user = current_user_from_request(required=True)
        return {"me": users.get_public(user["sub"])}
    if name == "UpdateProfile":
        user = current_user_from_request(required=True)
        data = UpdateProfileSchema().load(variables.get("input") or {}, partial=True)
        return {"updateProfile": users.serialize(users.update(user["sub"], data))}
    if name == "Users":
        require_role("admin")
        role = variables.get("role")
        return {"users": users.list(q=variables.get("q"), role=role.lower() if role else None, page=variables.get("page") or 1, limit=variables.get("limit") or 20)}
    if name == "User":
        require_role("admin")
        return {"user": users.get_public(variables["id"])}
    if name == "CreateUser":
        require_role("admin")
        data = CreateUserSchema().load(variables.get("input") or {})
        return {"createUser": users.serialize(users.create(data))}
    if name == "UpdateUser":
        require_role("admin")
        data = UpdateUserSchema().load(variables.get("input") or {}, partial=True)
        return {"updateUser": users.serialize(users.update(variables["id"], data))}
    if name == "RemoveUser":
        require_role("admin")
        users.delete(variables["id"])
        return {"removeUser": {"success": True}}

    if name == "Products":
        return {
            "products": products.list(
                q=variables.get("q"),
                category=variables.get("category"),
                category_id=variables.get("categoryId"),
                tags=variables.get("tags"),
                min_price=variables.get("minPrice"),
                max_price=variables.get("maxPrice"),
                sort=variables.get("sort"),
                page=variables.get("page") or 1,
                limit=variables.get("limit") or 20,
            )
        }
    if name == "Product":
        return {"product": products.get(variables["id"])}
    if name == "TopProducts":
        return {"topProducts": products.top(variables.get("limit") or 10)}
    if name == "CreateProduct":
        user = require_role("admin")
        data = CreateProductSchema().load(variables.get("input") or {})
        return {"createProduct": products.create(data, created_by=user["sub"])}
    if name == "UpdateProduct":
        require_role("admin")
        data = UpdateProductSchema().load(variables.get("input") or {}, partial=True)
        return {"updateProduct": products.update(variables["id"], data)}
    if name == "RemoveProduct":
        require_role("admin")
        products.delete(variables["id"])
        return {"removeProduct": {"success": True}}

    if name == "Categories":
        return {"categories": categories.list()}
    if name == "CategoryThumbnail":
        return {"categoryThumbnail": categories.thumbnail(variables["id"])}
    if name == "Category":
        return {"category": categories.get(variables["id"])}
    if name == "CreateCategory":
        require_role("admin")
        return {"createCategory": categories.create(CreateCategorySchema().load(variables.get("input") or {}))}
    if name == "UpdateCategory":
        require_role("admin")
        data = UpdateCategorySchema().load(variables.get("input") or {}, partial=True)
        return {"updateCategory": categories.update(variables["id"], data)}
    if name == "RemoveCategory":
        require_role("admin")
        categories.delete(variables["id"])
        return {"removeCategory": {"success": True}}

    if name == "Discounts":
        result = discounts.list(product_id=variables.get("productId"), page=variables.get("page") or 1, limit=variables.get("limit") or 20)
        return {"discounts": result["items"]}
    if name == "Discount":
        return {"discount": discounts.get(variables["id"])}
    if name == "CreateDiscount":
        require_role("admin")
        return {"createDiscount": discounts.create(CreateDiscountSchema().load(variables.get("input") or {}))}
    if name == "UpdateDiscount":
        require_role("admin")
        data = UpdateDiscountSchema().load(variables.get("input") or {}, partial=True)
        return {"updateDiscount": discounts.update(variables["id"], data)}
    if name == "RemoveDiscount":
        require_role("admin")
        discounts.delete(variables["id"])
        return {"removeDiscount": {"success": True}}

    if name == "Reviews":
        return {"reviews": reviews.list(product_id=variables.get("productId"), user_id=variables.get("userId"), page=variables.get("page") or 1, limit=variables.get("limit") or 20)}
    if name == "Review":
        return {"review": reviews.get(variables["id"])}
    if name == "CreateReview":
        user = current_user_from_request(required=True)
        data = CreateReviewSchema().load(variables.get("input") or {})
        return {"createReview": reviews.create(data, user["sub"])}
    if name == "UpdateReview":
        user = current_user_from_request(required=True)
        data = UpdateReviewSchema().load(variables.get("input") or {}, partial=True)
        return {"updateReview": reviews.update(variables["id"], data, user)}
    if name == "RemoveReview":
        reviews.delete(variables["id"], current_user_from_request(required=True))
        return {"removeReview": {"success": True}}

    if name == "CreateOrder":
        user = current_user_from_request(required=True)
        return {"createOrder": orders.create(CreateOrderSchema().load(variables.get("input") or {}), user)}
    if name == "MyOrders":
        user = current_user_from_request(required=True)
        return {"myOrders": orders.list(user_id=user["sub"], page=variables.get("page") or 1, limit=variables.get("limit") or 20)}
    if name == "Orders":
        require_role("admin")
        return {"orders": orders.list(page=variables.get("page") or 1, limit=variables.get("limit") or 20)}
    if name == "Order":
        return {"order": orders.get(variables["id"], current_user_from_request(required=True))}
    if name == "UpdateOrderStatus":
        require_role("admin")
        return {"updateOrderStatus": orders.update_status(variables["id"], UpdateOrderSchema().load(variables.get("input") or {}))}

    if name == "DeleteFile":
        current_user_from_request(required=True)
        url = variables.get("url")
        return {"deleteFile": FileStorageService().delete_by_url(url)}
    if name == "FileName":
        return {"fileName": {"filename": FileStorageService().filename_from_url(variables.get("url") or "")}}

    raise BadRequestError("Unsupported GraphQL operation")


def _server_origin():
    proto = request.headers.get("x-forwarded-proto") or request.scheme or "http"
    host = request.headers.get("x-forwarded-host") or request.host
    return f"{proto}://{host}"
