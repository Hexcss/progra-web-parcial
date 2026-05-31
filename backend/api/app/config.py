import os
from datetime import timedelta

from dotenv import load_dotenv

load_dotenv()


def _bool(name: str, default: bool = False) -> bool:
    return os.getenv(name, str(default)).lower() in {"1", "true", "yes", "on"}


def _origins() -> list[str]:
    raw = os.getenv("CORS_ORIGINS") or os.getenv("CORS_ORIGIN", "http://localhost:5173,http://localhost:3000")
    return [origin.strip() for origin in raw.split(",") if origin.strip()]


def _ttl_seconds(value: str | None, fallback_seconds: int) -> int:
    if not value:
        return fallback_seconds
    value = value.strip()
    if value.isdigit():
        return int(value)
    unit = value[-1].lower()
    amount = value[:-1]
    if not amount.isdigit() or unit not in {"s", "m", "h", "d"}:
        return fallback_seconds
    multiplier = {"s": 1, "m": 60, "h": 3600, "d": 86400}[unit]
    return int(amount) * multiplier


class Config:
    DEBUG = _bool("FLASK_DEBUG", True)
    MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/portal")
    MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "portal")
    CLIENT_URL = os.getenv("CLIENT_URL") or (_origins()[0] if _origins() else "http://localhost:5173")
    NODE_ENV = os.getenv("NODE_ENV", "development")

    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY") or os.getenv("JWT_ACCESS_SECRET", "dev-change-me")
    JWT_REFRESH_SECRET = os.getenv("JWT_REFRESH_SECRET", JWT_SECRET_KEY)
    JWT_EMAIL_VERIFY_SECRET = os.getenv("JWT_EMAIL_VERIFY_SECRET", JWT_SECRET_KEY)
    JWT_TOKEN_LOCATION = ["cookies"]
    JWT_COOKIE_CSRF_PROTECT = False
    JWT_ACCESS_COOKIE_NAME = "accessToken"
    JWT_REFRESH_COOKIE_NAME = "refreshToken"
    JWT_ACCESS_MAX_AGE_SECONDS = _ttl_seconds(os.getenv("JWT_ACCESS_EXPIRES"), int(os.getenv("JWT_ACCESS_MAX_AGE_SECONDS", "900")))
    JWT_REFRESH_MAX_AGE_SECONDS = _ttl_seconds(os.getenv("JWT_REFRESH_EXPIRES"), int(os.getenv("JWT_REFRESH_MAX_AGE_SECONDS", "604800")))
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(seconds=JWT_ACCESS_MAX_AGE_SECONDS)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(seconds=JWT_REFRESH_MAX_AGE_SECONDS)

    COOKIE_SECURE = _bool("COOKIE_SECURE", False)
    COOKIE_SAMESITE = os.getenv("COOKIE_SAMESITE", "Lax")
    CORS_ORIGINS = _origins()

    UPLOAD_FOLDER = os.getenv("UPLOAD_FOLDER", os.path.abspath("uploads"))
    MAX_CONTENT_LENGTH = int(os.getenv("MAX_UPLOAD_MB", "10")) * 1024 * 1024
    STORAGE_BUCKET = os.getenv("STORAGE_BUCKET") or os.getenv("GCS_BUCKET", "")
    GCS_BUCKET = STORAGE_BUCKET
    RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
    EMAIL_FROM = os.getenv("EMAIL_FROM", "Market <no-reply@hexcss.com>")
    EMAIL_VERIFY_EXPIRES_SECONDS = int(os.getenv("EMAIL_VERIFY_EXPIRES_SECONDS", str(2 * 86400)))

    OAUTH_GOOGLE_CLIENT_ID = os.getenv("OAUTH_GOOGLE_CLIENT_ID", "")
    OAUTH_GOOGLE_CLIENT_SECRET = os.getenv("OAUTH_GOOGLE_CLIENT_SECRET", "")
    OAUTH_GOOGLE_REDIRECT_URI = os.getenv("OAUTH_GOOGLE_REDIRECT_URI", "")
    OAUTH_GITHUB_CLIENT_ID = os.getenv("OAUTH_GITHUB_CLIENT_ID", "")
    OAUTH_GITHUB_CLIENT_SECRET = os.getenv("OAUTH_GITHUB_CLIENT_SECRET", "")
    OAUTH_GITHUB_REDIRECT_URI = os.getenv("OAUTH_GITHUB_REDIRECT_URI", "")
