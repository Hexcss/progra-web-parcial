from __future__ import annotations

from datetime import datetime, timedelta, timezone
from functools import wraps

import jwt as pyjwt
from flask import current_app, g, jsonify, request
from flask_jwt_extended import create_access_token, get_jwt, verify_jwt_in_request
from flask_jwt_extended.exceptions import JWTExtendedException
from jwt import ExpiredSignatureError, InvalidTokenError

from .errors import ForbiddenError, UnauthorizedError

ROLE_LEVELS = {"user": 10, "admin": 100}


def create_tokens(user):
    claims = {
        "email": user["email"],
        "role": user["role"],
        "emailVerified": bool(user.get("emailVerified", False)),
    }
    identity = str(user["_id"])
    return (
        create_access_token(identity=identity, additional_claims=claims),
        _create_refresh_token(identity, claims),
    )


def _create_refresh_token(identity: str, claims: dict):
    payload = {
        "sub": identity,
        **claims,
        "exp": datetime.now(timezone.utc) + timedelta(seconds=current_app.config["JWT_REFRESH_MAX_AGE_SECONDS"]),
    }
    return pyjwt.encode(payload, current_app.config["JWT_REFRESH_SECRET"], algorithm="HS256")


def set_auth_cookies(response, access_token: str, refresh_token: str):
    response.set_cookie(
        "accessToken",
        access_token,
        httponly=True,
        secure=current_app.config["COOKIE_SECURE"],
        samesite=current_app.config.get("COOKIE_SAMESITE", "Lax"),
        path="/",
        max_age=current_app.config["JWT_ACCESS_MAX_AGE_SECONDS"],
    )
    response.set_cookie(
        "refreshToken",
        refresh_token,
        httponly=True,
        secure=current_app.config["COOKIE_SECURE"],
        samesite=current_app.config.get("COOKIE_SAMESITE", "Lax"),
        path="/",
        max_age=current_app.config["JWT_REFRESH_MAX_AGE_SECONDS"],
    )


def clear_auth_cookies(response):
    response.delete_cookie("accessToken", path="/")
    response.delete_cookie("refreshToken", path="/")


def _claims_to_current(claims: dict) -> dict:
    return {
        "sub": str(claims.get("sub")),
        "email": claims.get("email"),
        "role": str(claims.get("role", "user")).lower(),
        "emailVerified": bool(claims.get("emailVerified", False)),
    }


def current_user_from_request(required: bool = True) -> dict | None:
    try:
        verify_jwt_in_request(locations=["cookies"])
        g.current_user = _claims_to_current(get_jwt())
        return g.current_user
    except ExpiredSignatureError:
        return _refresh_from_cookie(required)
    except (JWTExtendedException, InvalidTokenError):
        if not required:
            return None
        return _refresh_from_cookie(required)


def _refresh_from_cookie(required: bool) -> dict | None:
    refresh_token = request.cookies.get("refreshToken")
    if not refresh_token:
        if required:
            raise UnauthorizedError("Authentication required")
        return None
    try:
        claims = pyjwt.decode(refresh_token, current_app.config["JWT_REFRESH_SECRET"], algorithms=["HS256"])
        user = _claims_to_current(claims)
        access, refresh = create_access_token(
            identity=user["sub"],
            additional_claims={k: user[k] for k in ("email", "role", "emailVerified")},
        ), _create_refresh_token(
            user["sub"],
            {k: user[k] for k in ("email", "role", "emailVerified")},
        )
        g.current_user = user
        g.new_auth_tokens = (access, refresh)
        return user
    except Exception as exc:
        if required:
            raise UnauthorizedError("Authentication required") from exc
        return None


def auth_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        current_user_from_request(required=True)
        response = fn(*args, **kwargs)
        return attach_refreshed_cookies(response)

    return wrapper


def roles_required(min_role: str):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            user = current_user_from_request(required=True)
            if ROLE_LEVELS.get(user["role"], 0) < ROLE_LEVELS[min_role]:
                raise ForbiddenError("Insufficient role")
            response = fn(*args, **kwargs)
            return attach_refreshed_cookies(response)

        return wrapper

    return decorator


def require_role(min_role: str) -> dict:
    user = current_user_from_request(required=True)
    if ROLE_LEVELS.get(user["role"], 0) < ROLE_LEVELS[min_role]:
        raise ForbiddenError("Insufficient role")
    return user


def attach_refreshed_cookies(response):
    tokens = getattr(g, "new_auth_tokens", None)
    if not tokens:
        return response
    flask_response = response
    if isinstance(response, tuple):
        flask_response = response[0]
    set_auth_cookies(flask_response, tokens[0], tokens[1])
    return response


def json_response(payload, status=200, with_cookies: tuple[str, str] | None = None):
    response = jsonify(payload)
    if with_cookies:
        set_auth_cookies(response, with_cookies[0], with_cookies[1])
    return response, status
