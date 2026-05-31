from __future__ import annotations

import os
import unicodedata
from datetime import datetime, timezone
from uuid import uuid4
from urllib.parse import quote, unquote, urlparse, parse_qs

from flask import current_app, request
from werkzeug.utils import secure_filename


def _safe_base(filename: str) -> str:
    base, ext = os.path.splitext(filename or "upload")
    normalized = unicodedata.normalize("NFKD", base).encode("ascii", "ignore").decode("ascii")
    safe_base = secure_filename(normalized)[:80] or "file"
    safe_ext = "".join(ch for ch in ext.lower() if ch == "." or ch.isalnum())
    return f"{safe_base}{safe_ext}"


class FileStorageService:
    def __init__(self):
        self.bucket_name = current_app.config.get("STORAGE_BUCKET") or current_app.config.get("GCS_BUCKET") or ""

    def upload(self, file, *, user_id: str, folder: str | None = None):
        if not file or not file.filename:
            raise ValueError("Invalid file")
        now = datetime.now(timezone.utc)
        filename = _safe_base(file.filename)
        key = f"{folder or 'uploads'}/{user_id}/{now:%Y}/{now:%m}/{uuid4()}_{filename}"
        data = file.read()
        size = len(data)
        mime_type = file.mimetype or "application/octet-stream"

        if self.bucket_name:
            from google.cloud import storage

            client = storage.Client()
            blob = client.bucket(self.bucket_name).blob(key)
            blob.upload_from_string(data, content_type=mime_type)
            blob.cache_control = "public, max-age=31536000, immutable"
            blob.patch()
            return {
                "url": self.public_url(key),
                "key": key,
                "filename": os.path.basename(key),
                "size": size,
                "mimeType": mime_type,
            }

        upload_root = current_app.config["UPLOAD_FOLDER"]
        path = self._local_path(key)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "wb") as fh:
            fh.write(data)
        return {
            "url": request.host_url.rstrip("/") + "/uploads/" + key,
            "key": key,
            "filename": os.path.basename(key),
            "size": size,
            "mimeType": mime_type,
        }

    def delete_by_url(self, url: str):
        key = self.object_path_from_url(url)
        if not key:
            return {"success": False}
        if self.bucket_name:
            from google.cloud import storage
            from google.api_core.exceptions import NotFound

            try:
                storage.Client().bucket(self.bucket_name).blob(key).delete()
            except NotFound:
                pass
            return {"success": True}
        path = self._local_path(key)
        if os.path.exists(path):
            os.remove(path)
        return {"success": True}

    def filename_from_url(self, url: str):
        key = self.object_path_from_url(url)
        return os.path.basename(key) if key else ""

    def object_path_from_url(self, url: str):
        if not url:
            return ""
        parsed = urlparse(url)
        host = parsed.hostname or ""
        path = unquote(parsed.path.lstrip("/"))
        if self.bucket_name and host == "storage.googleapis.com" and path.startswith(f"{self.bucket_name}/"):
            return path[len(self.bucket_name) + 1 :]
        if self.bucket_name and host == f"{self.bucket_name}.storage.googleapis.com":
            return path
        qs = parse_qs(parsed.query)
        if qs.get("bucket", [""])[0] == self.bucket_name:
            return qs.get("name", qs.get("object", qs.get("o", [""])))[0]
        if path.startswith("uploads/"):
            return path
        return path.split("uploads/", 1)[-1] if "uploads/" in path else path

    def public_url(self, key: str):
        return f"https://storage.googleapis.com/{self.bucket_name}/{quote(key).replace('%2F', '/')}"

    def _local_path(self, key: str):
        root = os.path.abspath(current_app.config["UPLOAD_FOLDER"])
        path = os.path.abspath(os.path.join(root, key))
        if not path.startswith(root + os.sep):
            raise ValueError("Invalid file path")
        return path
