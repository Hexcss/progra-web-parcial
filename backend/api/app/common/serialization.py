from datetime import date, datetime, timezone
from decimal import Decimal


def iso(value):
    if value is None:
        return None
    if isinstance(value, datetime):
        if value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)
        return value.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")
    if isinstance(value, date):
        return value.isoformat()
    return value


def money(value):
    if value is None:
        return None
    if isinstance(value, Decimal):
        return float(value)
    return float(value)


def model_id(value) -> str | None:
    if value is None:
        return None
    return str(value)

