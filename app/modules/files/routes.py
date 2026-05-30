import os
from uuid import uuid4

from flask import Blueprint, current_app, jsonify, request
from werkzeug.utils import secure_filename

from ...common.auth import auth_required
from ...common.errors import BadRequestError

bp = Blueprint("files", __name__)


def _public_url(filename: str) -> str:
    return request.host_url.rstrip("/") + "/uploads/" + filename


@bp.post("/upload")
@auth_required
def upload_file():
    file = request.files.get("file")
    if not file:
        raise BadRequestError("File is required")
    safe_name = secure_filename(file.filename or "upload")
    stored = f"{uuid4()}-{safe_name}"
    os.makedirs(current_app.config["UPLOAD_FOLDER"], exist_ok=True)
    path = os.path.join(current_app.config["UPLOAD_FOLDER"], stored)
    file.save(path)
    return jsonify(
        {
            "url": _public_url(stored),
            "key": stored,
            "filename": safe_name,
            "size": os.path.getsize(path),
            "mimeType": file.mimetype or "application/octet-stream",
        }
    )


@bp.delete("")
@auth_required
def delete_file():
    url = request.args.get("url")
    if not url:
        raise BadRequestError("url is required")
    filename = url.rstrip("/").split("/")[-1]
    path = os.path.join(current_app.config["UPLOAD_FOLDER"], filename)
    if os.path.exists(path):
        os.remove(path)
    return jsonify({"success": True})

