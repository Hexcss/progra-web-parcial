from flask_cors import CORS
from flask_jwt_extended import JWTManager
from pymongo import MongoClient
from pymongo.uri_parser import parse_uri

jwt = JWTManager()
cors = CORS()


class MongoExtension:
    def __init__(self):
        self.client = None
        self.db = None

    def init_app(self, app):
        uri = app.config["MONGO_URI"]
        if uri.startswith("mongomock://"):
            import mongomock

            self.client = mongomock.MongoClient()
            db_name = uri.rsplit("/", 1)[-1] or app.config["MONGO_DB_NAME"]
        else:
            self.client = MongoClient(uri)
            parsed = parse_uri(uri)
            db_name = parsed.get("database") or app.config["MONGO_DB_NAME"]
        self.db = self.client[db_name]
        app.extensions["mongo"] = self

    def collection(self, name: str):
        if self.db is None:
            raise RuntimeError("Mongo extension is not initialized")
        return self.db[name]


mongo = MongoExtension()
