from flask import Blueprint, jsonify, redirect, request

from ...common.auth import auth_required, clear_auth_cookies, current_user_from_request, json_response
from ...common.errors import AppError
from .schemas import LoginSchema, RegisterSchema
from .service import AuthService
from ..users.schemas import UserOutSchema

bp = Blueprint("auth", __name__)
service = AuthService()
user_out = UserOutSchema()


@bp.post("/register")
def register():
    data = RegisterSchema().load(request.get_json() or {})
    user, tokens = service.register(data)
    return json_response({"user": user_out.dump(user), "verificationEmail": service.verification_email_status()}, 201, tokens)


@bp.post("/login")
def login():
    data = LoginSchema().load(request.get_json() or {})
    user, tokens = service.login(data)
    return json_response({"user": user_out.dump(user)}, 200, tokens)


@bp.get("/me")
@auth_required
def me():
    return jsonify(service.session_payload(current_user_from_request()))


@bp.post("/logout")
@auth_required
def logout():
    response = jsonify({"success": True})
    clear_auth_cookies(response)
    return response


@bp.get("/ws-ticket")
@auth_required
def ws_ticket():
    return jsonify({"token": service.ws_ticket(current_user_from_request())})


@bp.get("/verify-email")
def verify_email():
    return redirect(request.args.get("redirect") or "/", code=302)


@bp.get("/oauth/<provider>/start")
@bp.get("/oauth/<provider>/callback")
def oauth_not_implemented(provider):
    raise AppError(f"OAuth provider {provider} is not implemented in the Flask practice backend", status_code=501)

