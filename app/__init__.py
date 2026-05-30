from flask import Flask, send_from_directory

from .config import Config
from .extensions import cors, jwt, mongo
from .common.errors import register_error_handlers


def create_app(config_object=Config):
    app = Flask(__name__)
    app.config.from_object(config_object)

    mongo.init_app(app)
    jwt.init_app(app)
    cors.init_app(
        app,
        supports_credentials=True,
        origins=app.config["CORS_ORIGINS"],
    )

    register_error_handlers(app)

    from .modules.health.routes import bp as health_bp
    from .modules.auth.routes import bp as auth_bp
    from .modules.users.routes import bp as users_bp
    from .modules.products.routes import bp as products_bp
    from .modules.categories.routes import bp as categories_bp
    from .modules.discounts.routes import bp as discounts_bp
    from .modules.reviews.routes import bp as reviews_bp
    from .modules.orders.routes import bp as orders_bp
    from .modules.files.routes import bp as files_bp
    from .modules.graphql.routes import bp as graphql_bp

    app.register_blueprint(health_bp)
    app.register_blueprint(auth_bp, url_prefix="/auth")
    app.register_blueprint(users_bp, url_prefix="/users")
    app.register_blueprint(products_bp, url_prefix="/products")
    app.register_blueprint(categories_bp, url_prefix="/categories")
    app.register_blueprint(discounts_bp, url_prefix="/discounts")
    app.register_blueprint(reviews_bp, url_prefix="/reviews")
    app.register_blueprint(orders_bp, url_prefix="/orders")
    app.register_blueprint(files_bp, url_prefix="/files")
    app.register_blueprint(graphql_bp, url_prefix="/graphql")

    @app.get("/uploads/<path:filename>")
    def uploaded_file(filename):
        return send_from_directory(app.config["UPLOAD_FOLDER"], filename)

    _ensure_indexes()

    return app


def _ensure_indexes():
    mongo.collection("users").create_index("email", unique=True)
    mongo.collection("categories").create_index("name", unique=True)
    mongo.collection("products").create_index("name")
    mongo.collection("reviews").create_index([("productId", 1), ("userId", 1)], unique=True)
    mongo.collection("discounts").create_index("productId")
    mongo.collection("orders").create_index("userId")
