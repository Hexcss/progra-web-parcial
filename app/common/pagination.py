from flask import request


def get_pagination(default_limit: int = 20, max_limit: int = 100) -> tuple[int, int]:
    page = max(int(request.args.get("page", 1)), 1)
    limit = max(min(int(request.args.get("limit", default_limit)), max_limit), 1)
    return page, limit


def paginate_response(items, total: int, page: int, limit: int) -> dict:
    return {"items": items, "total": total, "page": page, "limit": limit}

