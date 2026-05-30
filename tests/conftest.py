import os
import sys

import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app import create_app
from app.extensions import mongo


class TestConfig:
    TESTING = True
    DEBUG = False
    MONGO_URI = "mongomock://localhost/portal_test"
    MONGO_DB_NAME = "portal_test"
    JWT_SECRET_KEY = "test-secret"
    JWT_TOKEN_LOCATION = ["cookies"]
    JWT_COOKIE_CSRF_PROTECT = False
    JWT_ACCESS_COOKIE_NAME = "accessToken"
    JWT_REFRESH_COOKIE_NAME = "refreshToken"
    JWT_ACCESS_MAX_AGE_SECONDS = 900
    JWT_REFRESH_MAX_AGE_SECONDS = 604800
    COOKIE_SECURE = False
    COOKIE_SAMESITE = "Lax"
    CORS_ORIGINS = ["http://localhost:5173"]
    UPLOAD_FOLDER = "/tmp/progra-web-parcial-test-uploads"
    MAX_CONTENT_LENGTH = 10 * 1024 * 1024


@pytest.fixture()
def app():
    app = create_app(TestConfig)
    with app.app_context():
        for name in mongo.db.list_collection_names():
            mongo.db.drop_collection(name)
        app.extensions["mongo"].collection("users").create_index("email", unique=True)
        app.extensions["mongo"].collection("categories").create_index("name", unique=True)
        app.extensions["mongo"].collection("reviews").create_index([("productId", 1), ("userId", 1)], unique=True)
    yield app
    with app.app_context():
        for name in mongo.db.list_collection_names():
            mongo.db.drop_collection(name)


@pytest.fixture()
def client(app):
    return app.test_client()
