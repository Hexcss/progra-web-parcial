import os
from datetime import timedelta

from dotenv import load_dotenv

load_dotenv()


def _bool(name: str, default: bool = False) -> bool:
    return os.getenv(name, str(default)).lower() in {"1", "true", "yes", "on"}


def _origins() -> list[str]:
    raw = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000")
    return [origin.strip() for origin in raw.split(",") if origin.strip()]


class Config:
    DEBUG = _bool("FLASK_DEBUG", True)
    MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/portal")
    MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "portal")

    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY") or os.getenv("JWT_ACCESS_SECRET", "dev-change-me")
    JWT_TOKEN_LOCATION = ["cookies"]
    JWT_COOKIE_CSRF_PROTECT = False
    JWT_ACCESS_COOKIE_NAME = "accessToken"
    JWT_REFRESH_COOKIE_NAME = "refreshToken"
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=int(os.getenv("JWT_ACCESS_MINUTES", "15")))
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=int(os.getenv("JWT_REFRESH_DAYS", "7")))

    JWT_ACCESS_MAX_AGE_SECONDS = int(os.getenv("JWT_ACCESS_MAX_AGE_SECONDS", "900"))
    JWT_REFRESH_MAX_AGE_SECONDS = int(os.getenv("JWT_REFRESH_MAX_AGE_SECONDS", "604800"))
    COOKIE_SECURE = _bool("COOKIE_SECURE", False)
    COOKIE_SAMESITE = os.getenv("COOKIE_SAMESITE", "Lax")
    CORS_ORIGINS = _origins()

    UPLOAD_FOLDER = os.getenv("UPLOAD_FOLDER", os.path.abspath("uploads"))
    MAX_CONTENT_LENGTH = int(os.getenv("MAX_UPLOAD_MB", "10")) * 1024 * 1024
