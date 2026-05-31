from flask import Blueprint, jsonify, request

from ...common.auth import auth_required, current_user_from_request
from ...common.errors import BadRequestError
from ...common.storage import FileStorageService

bp = Blueprint("files", __name__)


@bp.post("/upload")
@auth_required
def upload_file():
    file = request.files.get("file")
    if not file:
        raise BadRequestError("File is required")
    user = current_user_from_request()
    uploaded = FileStorageService().upload(file, user_id=user["sub"], folder=request.form.get("folder"))
    return jsonify(uploaded)


@bp.delete("")
@auth_required
def delete_file():
    url = request.args.get("url")
    if not url:
        raise BadRequestError("url is required")
    return jsonify(FileStorageService().delete_by_url(url))

