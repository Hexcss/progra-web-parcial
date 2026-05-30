from datetime import datetime, timedelta, timezone

from app import create_app
from app.common.security import hash_password, normalize_email
from app.extensions import mongo


def seed():
    app = create_app()
    with app.app_context():
        users = mongo.collection("users")
        categories = mongo.collection("categories")
        products = mongo.collection("products")
        discounts = mongo.collection("discounts")

        admin_email = normalize_email("admin@example.com")
        if not users.find_one({"email": admin_email}):
            users.insert_one(
                {
                    "email": admin_email,
                    "passwordHash": hash_password("admin123"),
                    "displayName": "Admin",
                    "role": "admin",
                    "emailVerified": True,
                    "createdAt": datetime.now(timezone.utc),
                    "updatedAt": datetime.now(timezone.utc),
                }
            )

        user_email = normalize_email("user@example.com")
        if not users.find_one({"email": user_email}):
            users.insert_one(
                {
                    "email": user_email,
                    "passwordHash": hash_password("user123"),
                    "displayName": "Demo User",
                    "role": "user",
                    "emailVerified": True,
                    "createdAt": datetime.now(timezone.utc),
                    "updatedAt": datetime.now(timezone.utc),
                }
            )

        admin = users.find_one({"email": admin_email})
        category = categories.find_one({"name": "General"})
        if not category:
            category = {
                "name": "General",
                "icon": "storefront",
                "createdAt": datetime.now(timezone.utc),
                "updatedAt": datetime.now(timezone.utc),
            }
            categories.insert_one(category)

        product = products.find_one({"name": "Producto demo"})
        if not product:
            product = {
                "name": "Producto demo",
                "description": "Producto de ejemplo para la practica.",
                "price": 19.99,
                "stock": 25,
                "imageUrl": "https://placehold.co/600x400",
                "category": "General",
                "categoryId": str(category["_id"]),
                "tags": ["demo"],
                "createdBy": str(admin["_id"]) if admin else None,
                "createdAt": datetime.now(timezone.utc),
                "updatedAt": datetime.now(timezone.utc),
            }
            products.insert_one(product)

        if product and not discounts.find_one({"productId": str(product["_id"])}):
            now = datetime.now(timezone.utc)
            discounts.insert_one(
                {
                    "productId": str(product["_id"]),
                    "discountPercent": 10,
                    "startDate": now - timedelta(days=1),
                    "endDate": now + timedelta(days=30),
                    "createdAt": now,
                    "updatedAt": now,
                }
            )

        print("Seed complete: admin@example.com/admin123, user@example.com/user123")


if __name__ == "__main__":
    seed()

