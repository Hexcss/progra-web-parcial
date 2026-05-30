from datetime import datetime, timezone

from bson import ObjectId


def now_utc():
    return datetime.now(timezone.utc)


def object_id(value: str):
    try:
        return ObjectId(value)
    except Exception:
        return None


def id_filter(value: str):
    oid = object_id(value)
    return {"_id": oid if oid is not None else value}


def with_timestamps(doc: dict):
    now = now_utc()
    doc.setdefault("createdAt", now)
    doc.setdefault("updatedAt", now)
    return doc

