from __future__ import annotations

import html

import requests
from flask import current_app


def _empty_result(attempted=False, error=None):
    return {"attempted": attempted, "sent": False, "id": None, "error": error}


class EmailService:
    def send(self, *, to, subject: str, html_body: str | None = None, text: str | None = None, from_email: str | None = None):
        api_key = current_app.config.get("RESEND_API_KEY") or ""
        if not api_key:
            return _empty_result(attempted=False)
        recipients = to if isinstance(to, list) else [to]
        if not recipients:
            return _empty_result(attempted=True, error="missing_recipients")
        if not html_body and not text:
            return _empty_result(attempted=True, error="missing_content")

        payload = {
            "from": from_email or current_app.config.get("EMAIL_FROM") or "Market <no-reply@hexcss.com>",
            "to": recipients,
            "subject": subject,
        }
        if html_body:
            payload["html"] = html_body
        if text:
            payload["text"] = text

        try:
            response = requests.post(
                "https://api.resend.com/emails",
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json=payload,
                timeout=15,
            )
            data = response.json() if response.content else {}
            if not response.ok:
                return _empty_result(attempted=True, error=data.get("message") or response.text or "resend_error")
            email_id = data.get("id") or data.get("data", {}).get("id")
            return {"attempted": True, "sent": bool(email_id), "id": email_id, "error": None}
        except Exception as exc:
            return _empty_result(attempted=True, error=str(exc))

    def send_email_verification(self, *, to: str, link: str, display_name: str | None = None):
        safe_name = html.escape(display_name or to)
        safe_link = html.escape(link, quote=True)
        html_body = f"""
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#F3F4F6;padding:24px 0;margin:0">
          <tr><td align="center" style="padding:0 16px">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:640px;background:#ffffff;border:1px solid rgba(59,130,246,.25);border-radius:12px;overflow:hidden">
              <tr><td style="height:4px;background:#3B82F6"></td></tr>
              <tr><td style="padding:20px;font-family:Inter,Arial,Helvetica,sans-serif">
                <p style="margin:0 0 8px 0;font-size:18px;line-height:26px;font-weight:800;color:#111827">Verifica tu correo</p>
                <p style="margin:0 0 16px 0;font-size:14px;line-height:22px;color:#4B5563">Hola {safe_name}, haz clic en el botón para verificar tu dirección de email.</p>
                <a href="{safe_link}" style="display:inline-block;background:#3B82F6;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;line-height:20px;padding:10px 16px;border-radius:999px;border:1px solid #1D4ED8">Verificar email</a>
                <p style="margin:16px 0 0 0;font-size:12px;line-height:18px;color:#6B7280">Si el botón no funciona, copia y pega este enlace:<br><span style="word-break:break-all;color:#1F2937">{safe_link}</span></p>
              </td></tr>
            </table>
          </td></tr>
        </table>
        """
        return self.send(to=to, subject="Verifica tu correo", html_body=html_body)

    def send_order_confirmation(self, order: dict):
        email = order.get("email")
        if not email:
            return _empty_result(attempted=False)
        rows = "".join(
            f"<tr><td>{html.escape(item.get('name') or '')}</td><td>{int(item.get('quantity') or 0)}</td><td>{float(item.get('unitPrice') or 0):.2f}</td><td>{float(item.get('lineTotal') or 0):.2f}</td></tr>"
            for item in order.get("items", [])
        )
        html_body = f"""
        <h2>Pedido confirmado</h2>
        <p>Nº de pedido: {html.escape(str(order.get('_id')))}</p>
        <table cellpadding="8" cellspacing="0" border="1">
          <thead><tr><th>Artículo</th><th>Cant.</th><th>Precio</th><th>Total</th></tr></thead>
          <tbody>{rows}</tbody>
        </table>
        <p><strong>Total: €{float(order.get('total') or 0):.2f}</strong></p>
        """
        return self.send(to=email, subject="Confirmación de pedido", html_body=html_body)

