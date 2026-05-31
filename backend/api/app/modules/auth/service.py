import secrets
from datetime import datetime, timedelta, timezone

import jwt
import requests
from flask import current_app
from flask_jwt_extended import create_access_token

from ...common.auth import create_tokens
from ...common.email import EmailService
from ...common.errors import NotFoundError, UnauthorizedError
from ...common.security import normalize_email, verify_password
from ..users.repository import UserRepository
from ..users.schemas import UserOutSchema
from ..users.service import UserService


class AuthService:
    def __init__(self):
        self.user_repo = UserRepository()
        self.user_service = UserService(self.user_repo)
        self.user_out = UserOutSchema()
        self.email = EmailService()

    def register(self, data: dict):
        user = self.user_service.create(data, default_role="user")
        return user, create_tokens(user)

    def login(self, data: dict):
        user = self.user_repo.find_by_email(normalize_email(data["email"]))
        if not user or not verify_password(user["passwordHash"], data["password"]):
            raise UnauthorizedError("Invalid credentials")
        return user, create_tokens(user)

    def session_payload(self, user_claims: dict):
        return {"sub": user_claims["sub"], "email": user_claims["email"], "role": user_claims["role"]}

    def ws_ticket(self, user_claims: dict) -> str:
        return create_access_token(
            identity=user_claims["sub"],
            additional_claims={"email": user_claims["email"], "role": user_claims["role"], "scope": "ws"},
            expires_delta=timedelta(seconds=60),
        )

    def maybe_send_email_verification(self, user: dict, server_origin: str):
        if not current_app.config.get("RESEND_API_KEY"):
            return {"attempted": False, "sent": False, "id": None, "error": None}
        token = jwt.encode(
            {
                "sub": str(user["_id"]),
                "email": user["email"],
                "typ": "email_verify",
                "exp": datetime.now(timezone.utc) + timedelta(seconds=current_app.config["EMAIL_VERIFY_EXPIRES_SECONDS"]),
            },
            current_app.config["JWT_EMAIL_VERIFY_SECRET"],
            algorithm="HS256",
        )
        verify_url = f"{server_origin.rstrip('/')}/auth/verify-email?token={token}"
        return self.email.send_email_verification(
            to=user["email"],
            link=verify_url,
            display_name=user.get("displayName") or user["email"],
        )

    def verify_email_token(self, token: str):
        try:
            decoded = jwt.decode(token, current_app.config["JWT_EMAIL_VERIFY_SECRET"], algorithms=["HS256"])
        except Exception as exc:
            raise UnauthorizedError("Invalid token") from exc
        if decoded.get("typ") != "email_verify" or not decoded.get("sub") or not decoded.get("email"):
            raise UnauthorizedError("Invalid token")
        user = self.user_repo.find_by_email(normalize_email(decoded["email"]))
        if not user or str(user["_id"]) != str(decoded["sub"]):
            raise UnauthorizedError("Invalid token")
        if not user.get("emailVerified"):
            self.user_repo.update(str(user["_id"]), {"emailVerified": True})
        return True

    def handle_google_code(self, code: str, redirect_uri: str, intent: str):
        token_res = requests.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": current_app.config["OAUTH_GOOGLE_CLIENT_ID"],
                "client_secret": current_app.config["OAUTH_GOOGLE_CLIENT_SECRET"],
                "redirect_uri": redirect_uri,
                "grant_type": "authorization_code",
            },
            timeout=15,
        )
        if not token_res.ok:
            raise UnauthorizedError(f"Google token exchange failed: {token_res.text}")
        access_token = token_res.json().get("access_token")
        if not access_token:
            raise UnauthorizedError("No access token from Google")
        info_res = requests.get(
            "https://openidconnect.googleapis.com/v1/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=15,
        )
        if not info_res.ok:
            raise UnauthorizedError(f"Google userinfo failed: {info_res.text}")
        info = info_res.json()
        return self._oauth_login_or_signup(
            "google",
            {"email": info.get("email"), "displayName": info.get("name"), "providerId": str(info.get("sub"))},
            intent,
        )

    def handle_github_code(self, code: str, redirect_uri: str, intent: str):
        token_res = requests.post(
            "https://github.com/login/oauth/access_token",
            headers={"Accept": "application/json", "Content-Type": "application/json"},
            json={
                "client_id": current_app.config["OAUTH_GITHUB_CLIENT_ID"],
                "client_secret": current_app.config["OAUTH_GITHUB_CLIENT_SECRET"],
                "code": code,
                "redirect_uri": redirect_uri,
            },
            timeout=15,
        )
        if not token_res.ok:
            raise UnauthorizedError(f"GitHub token exchange failed: {token_res.text}")
        access_token = token_res.json().get("access_token")
        if not access_token:
            raise UnauthorizedError("No access token from GitHub")
        headers = {"Authorization": f"Bearer {access_token}", "Accept": "application/vnd.github+json"}
        user_res = requests.get("https://api.github.com/user", headers=headers, timeout=15)
        if not user_res.ok:
            raise UnauthorizedError(f"GitHub user API failed: {user_res.text}")
        gh_user = user_res.json()
        email = gh_user.get("email")
        emails_res = requests.get("https://api.github.com/user/emails", headers=headers, timeout=15)
        if emails_res.ok:
            emails = emails_res.json()
            selected = next((e for e in emails if e.get("primary") and e.get("verified")), None)
            selected = selected or next((e for e in emails if e.get("verified")), None) or (emails[0] if emails else None)
            email = selected.get("email") if selected else email
        return self._oauth_login_or_signup(
            "github",
            {"email": email, "displayName": gh_user.get("name") or gh_user.get("login"), "providerId": str(gh_user.get("id"))},
            intent,
        )

    def _oauth_login_or_signup(self, provider: str, profile: dict, intent: str):
        email = normalize_email(profile.get("email") or "")
        if not email:
            raise UnauthorizedError(f"No email returned by {provider}")
        existing = self.user_repo.find_by_email(email)
        if existing:
            return existing, create_tokens(existing)
        if intent == "login":
            raise NotFoundError("Account not found. Please sign up first.")
        created = self.user_service.create(
            {
                "email": email,
                "password": secrets.token_urlsafe(36),
                "displayName": profile.get("displayName") or email.split("@")[0],
            }
        )
        created = self.user_repo.update(str(created["_id"]), {"emailVerified": True, f"{provider}Id": profile.get("providerId")})
        return created, create_tokens(created)
