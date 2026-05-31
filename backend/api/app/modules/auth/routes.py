import secrets

from flask import Blueprint, current_app, jsonify, redirect, request

from ...common.auth import auth_required, clear_auth_cookies, current_user_from_request, json_response, set_auth_cookies
from ...common.errors import BadRequestError
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
    verification = service.maybe_send_email_verification(user, _server_origin())
    return json_response({"user": user_out.dump(user), "verificationEmail": verification}, 201, tokens)


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
    token = request.args.get("token")
    if not token:
        raise BadRequestError("Missing token")
    service.verify_email_token(token)
    return redirect(current_app.config["CLIENT_URL"].rstrip("/") + "/market", code=303)


@bp.get("/oauth/google/start")
def google_start():
    return _oauth_start(
        provider="google",
        client_id=current_app.config["OAUTH_GOOGLE_CLIENT_ID"],
        scope="openid email profile",
        auth_url="https://accounts.google.com/o/oauth2/v2/auth",
    )


@bp.get("/oauth/google/callback")
def google_callback():
    return _oauth_callback("google")


@bp.get("/oauth/github/start")
def github_start():
    return _oauth_start(
        provider="github",
        client_id=current_app.config["OAUTH_GITHUB_CLIENT_ID"],
        scope="read:user user:email",
        auth_url="https://github.com/login/oauth/authorize",
    )


@bp.get("/oauth/github/callback")
def github_callback():
    return _oauth_callback("github")


def _server_origin():
    proto = request.headers.get("x-forwarded-proto") or request.scheme or "http"
    host = request.headers.get("x-forwarded-host") or request.host
    return f"{proto}://{host}"


def _cookie_options():
    return {
        "httponly": True,
        "secure": current_app.config["COOKIE_SECURE"],
        "samesite": current_app.config.get("COOKIE_SAMESITE", "Lax"),
        "path": "/",
        "max_age": 600,
    }


def _oauth_redirect_uri(provider: str):
    configured = current_app.config.get(f"OAUTH_{provider.upper()}_REDIRECT_URI")
    return configured or f"{_server_origin()}/auth/oauth/{provider}/callback"


def _oauth_start(*, provider: str, client_id: str, scope: str, auth_url: str):
    if not client_id:
        raise BadRequestError(f"Missing OAuth client id for {provider}")
    state = secrets.token_urlsafe(24)
    redirect_uri = _oauth_redirect_uri(provider)
    params = {
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": scope,
        "state": state,
    }
    if provider == "google":
        params["access_type"] = "online"
        params["include_granted_scopes"] = "true"
    from urllib.parse import urlencode

    response = redirect(f"{auth_url}?{urlencode(params)}")
    response.set_cookie("oauth_state", state, **_cookie_options())
    response.set_cookie("oauth_intent", request.args.get("intent", "login"), **_cookie_options())
    response.set_cookie("oauth_redirect", request.args.get("redirect", "/"), **_cookie_options())
    return response


def _oauth_callback(provider: str):
    code = request.args.get("code")
    state = request.args.get("state")
    saved_state = request.cookies.get("oauth_state")
    intent = request.cookies.get("oauth_intent") or "login"
    redirect_path = request.cookies.get("oauth_redirect") or "/"
    if not code or not state or not saved_state or state != saved_state:
        raise BadRequestError("Invalid OAuth state")
    redirect_uri = _oauth_redirect_uri(provider)
    if provider == "google":
        user, tokens = service.handle_google_code(code, redirect_uri, intent)
    else:
        user, tokens = service.handle_github_code(code, redirect_uri, intent)
    target = current_app.config["CLIENT_URL"].rstrip("/") + redirect_path
    response = redirect(target, code=303)
    response.delete_cookie("oauth_state", path="/")
    response.delete_cookie("oauth_intent", path="/")
    response.delete_cookie("oauth_redirect", path="/")
    set_auth_cookies(response, tokens[0], tokens[1])
    return response
