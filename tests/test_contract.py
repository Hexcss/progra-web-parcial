from app.common.security import hash_password
from app.extensions import mongo


def create_admin(app):
    with app.app_context():
        mongo.collection("users").insert_one(
            {
                "email": "admin@example.com",
                "passwordHash": hash_password("admin123"),
                "displayName": "Admin",
                "role": "admin",
                "emailVerified": True,
            }
        )


def login(client, email, password):
    return client.post("/auth/login", json={"email": email, "password": password})


def test_register_login_and_me(client):
    res = client.post(
        "/auth/register",
        json={"email": "user@example.com", "password": "secret123", "displayName": "User"},
    )
    assert res.status_code == 201
    assert "accessToken=" in res.headers.get("Set-Cookie", "")
    assert res.json["user"]["_id"]
    assert "password_hash" not in res.json["user"]

    me = client.get("/auth/me")
    assert me.status_code == 200
    assert me.json["email"] == "user@example.com"

    profile = client.get("/users/me")
    assert profile.status_code == 200
    assert profile.json["email"] == "user@example.com"


def test_user_cannot_create_product_but_admin_can(client, app):
    client.post("/auth/register", json={"email": "user2@example.com", "password": "secret123", "displayName": "User"})
    denied = client.post("/products", json={"name": "Bad", "price": 1, "stock": 1})
    assert denied.status_code == 403

    client.post("/auth/logout")
    create_admin(app)
    assert login(client, "admin@example.com", "admin123").status_code == 200
    created = client.post("/products", json={"name": "Keyboard", "price": 20, "stock": 5, "tags": ["tech"]})
    assert created.status_code == 201
    assert created.json["_id"]
    assert created.json["tags"] == ["tech"]

    listing = client.get("/products")
    assert listing.status_code == 200
    assert listing.json["total"] == 1
    assert listing.json["items"][0]["name"] == "Keyboard"


def test_validation_error_shape(client):
    res = client.post("/auth/register", json={"email": "bad", "password": "123", "displayName": ""})
    assert res.status_code == 422
    assert res.json["statusCode"] == 422
    assert isinstance(res.json["errors"], list)
    assert res.json["path"] == "/auth/register"


def test_graphql_contract(client, app):
    create_admin(app)
    res = client.post(
        "/graphql",
        json={
            "query": "mutation Login($input: LoginDto!) { login(input: $input) { user { _id email role } } }",
            "variables": {"input": {"email": "admin@example.com", "password": "admin123"}},
        },
    )
    assert res.status_code == 200
    assert res.json["data"]["login"]["user"]["role"] == "admin"

    product = client.post(
        "/graphql",
        json={
            "query": "mutation CreateProduct($input: CreateProductDto!) { createProduct(input: $input) { _id name price stock tags } }",
            "variables": {"input": {"name": "Mouse", "price": 10, "stock": 3}},
        },
    )
    assert product.status_code == 200
    assert product.json["data"]["createProduct"]["name"] == "Mouse"
