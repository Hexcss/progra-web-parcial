// src/shared/email/email.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

type EmailSendResult = {
  attempted: boolean;
  sent: boolean;
  id: string | null;
  error: string | null;
};

@Injectable()
export class EmailService {
  constructor(private readonly config: ConfigService) { }

  private getClient(): Resend | null {
    const apiKey = this.config.get<string>('RESEND_API_KEY') ?? '';
    if (!apiKey) return null;
    return new Resend(apiKey);
  }

  async send(options: {
    to: string | string[];
    subject: string;
    html?: string;
    text?: string;
    from?: string;
  }): Promise<EmailSendResult> {
    const result: EmailSendResult = { attempted: true, sent: false, id: null, error: null };
    const client = this.getClient();
    if (!client) {
      result.error = 'missing_api_key';
      return result;
    }

    const to = Array.isArray(options.to) ? options.to : [options.to];
    if (to.length === 0) {
      result.error = 'missing_recipients';
      return result;
    }

    if (!options.html && !options.text) {
      result.error = 'missing_content';
      return result;
    }

    const from = options.from ?? this.config.get<string>('EMAIL_FROM') ?? 'Market <no-reply@hexcss.com>';

    try {
      const res = options.html
        ? await client.emails.send({
            from,
            to,
            subject: options.subject,
            html: options.html,
          })
        : await client.emails.send({
            from,
            to,
            subject: options.subject,
            text: options.text!,
          });

      result.sent = !!(res as any)?.id || !!(res as any)?.data?.id;
      result.id = ((res as any)?.id ?? (res as any)?.data?.id) ?? null;
    } catch (e: any) {
      result.error = e?.message ?? 'unknown';
    }

    return result;
  }

  buildOrderConfirmationHtml(order: {
    _id: any;
    items: { name: string; quantity: number; unitPrice: number; lineTotal: number }[];
    total: number;
  }): string {
    const fmt = (n: number) => `€${Number(n).toFixed(2)}`;
    const subtotal = order.items.reduce((a, b) => a + (Number(b.lineTotal) || 0), 0);
    const rows = order.items
      .map(
        (it) =>
          `<tr>
          <td style="padding:12px 14px;border-bottom:1px solid rgba(230,126,34,.18);text-align:left;font-size:14px;line-height:20px;color:#1F2937">${it.name}</td>
          <td style="padding:12px 14px;border-bottom:1px solid rgba(230,126,34,.18);text-align:center;font-size:14px;line-height:20px;color:#4B5563">${it.quantity}</td>
          <td style="padding:12px 14px;border-bottom:1px solid rgba(230,126,34,.18);text-align:right;font-size:14px;line-height:20px;color:#4B5563">${fmt(it.unitPrice)}</td>
          <td style="padding:12px 14px;border-bottom:1px solid rgba(230,126,34,.18);text-align:right;font-size:14px;line-height:20px;color:#1F2937;font-weight:600">${fmt(it.lineTotal)}</td>
        </tr>`
      )
      .join("");

    return `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#FFF8F1;padding:24px 0;margin:0">
    <tr>
      <td align="center" style="padding:0 16px">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:640px;background:#ffffff;border:1px solid rgba(230,126,34,.18);border-radius:12px;overflow:hidden">
          <tr>
            <td style="padding:0">
              <div style="height:4px;background:#E67E22"></div>
            </td>
          </tr>

          <tr>
            <td style="padding:20px 20px 0 20px">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-family:Inter,Arial,Helvetica,sans-serif;font-size:20px;line-height:28px;font-weight:800;color:#E67E22">
                    Pedido confirmado
                  </td>
                  <td align="right" style="font-family:Inter,Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:#6B7280;white-space:nowrap">
                    Nº de pedido: <span style="color:#1F2937;font-weight:600">${order._id}</span>
                  </td>
                </tr>
              </table>
              <p style="margin:12px 0 0 0;font-family:Inter,Arial,Helvetica,sans-serif;font-size:14px;line-height:22px;color:#4B5563">
                Gracias por tu compra. A continuación encontrarás el resumen de tu pedido.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:16px 20px 0 20px">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;width:100%">
                <thead>
                  <tr style="background:rgba(230,126,34,.06)">
                    <th align="left" style="padding:10px 14px;font-family:Inter,Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:#6B7280;font-weight:700;text-transform:uppercase;letter-spacing:.02em;border-bottom:1px solid rgba(230,126,34,.18)">Artículo</th>
                    <th align="center" style="padding:10px 14px;font-family:Inter,Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:#6B7280;font-weight:700;text-transform:uppercase;letter-spacing:.02em;border-bottom:1px solid rgba(230,126,34,.18)">Cant.</th>
                    <th align="right" style="padding:10px 14px;font-family:Inter,Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:#6B7280;font-weight:700;text-transform:uppercase;letter-spacing:.02em;border-bottom:1px solid rgba(230,126,34,.18)">Precio</th>
                    <th align="right" style="padding:10px 14px;font-family:Inter,Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:#6B7280;font-weight:700;text-transform:uppercase;letter-spacing:.02em;border-bottom:1px solid rgba(230,126,34,.18)">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${rows || `<tr><td colspan="4" style="padding:16px 14px;text-align:center;color:#6B7280;font-family:Inter,Arial,Helvetica,sans-serif;font-size:14px">Sin artículos</td></tr>`}
                </tbody>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:8px 20px 0 20px">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="right" style="font-family:Inter,Arial,Helvetica,sans-serif;font-size:14px;line-height:22px;color:#4B5563;padding:4px 0">Subtotal</td>
                  <td align="right" style="width:140px;font-family:Inter,Arial,Helvetica,sans-serif;font-size:14px;line-height:22px;color:#1F2937;padding:4px 0">${fmt(subtotal)}</td>
                </tr>
                <tr>
                  <td align="right" style="font-family:Inter,Arial,Helvetica,sans-serif;font-size:14px;line-height:22px;color:#4B5563;padding:4px 0">Envío</td>
                  <td align="right" style="width:140px;font-family:Inter,Arial,Helvetica,sans-serif;font-size:14px;line-height:22px;color:#1F2937;padding:4px 0">Incluido</td>
                </tr>
                <tr>
                  <td colspan="2" style="padding-top:8px;border-top:1px solid rgba(230,126,34,.18)"></td>
                </tr>
                <tr>
                  <td align="right" style="font-family:Inter,Arial,Helvetica,sans-serif;font-size:16px;line-height:24px;color:#1F2937;font-weight:800;padding:8px 0">Total</td>
                  <td align="right" style="width:140px;font-family:Inter,Arial,Helvetica,sans-serif;font-size:18px;line-height:26px;color:#E67E22;font-weight:800;padding:8px 0">${fmt(order.total)}</td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:20px">
              <a href="#" style="display:inline-block;background:#E67E22;color:#ffffff;text-decoration:none;font-family:Inter,Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;line-height:20px;padding:10px 16px;border-radius:999px;border:1px solid #E67E22">Ver pedido</a>
            </td>
          </tr>

          <tr>
            <td style="padding:0 20px 20px 20px">
              <div style="height:1px;background:rgba(230,126,34,.18)"></div>
              <p style="margin:10px 0 0 0;font-family:Inter,Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:#6B7280">
                Si tienes alguna duda, responde a este correo. Gracias por confiar en nosotros.
              </p>
            </td>
          </tr>
        </table>

        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:640px;margin-top:12px">
          <tr>
            <td align="center" style="font-family:Inter,Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:#9CA3AF">
              © ${new Date().getFullYear()} NeoTech
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`;
  }

  async sendOrderConfirmation(order: {
    _id: any;
    email?: string | null;
    items: { name: string; quantity: number; unitPrice: number; lineTotal: number }[];
    total: number;
    from?: string;
  }): Promise<EmailSendResult> {
    if (!order?.email) {
      return { attempted: false, sent: false, id: null, error: null };
    }
    const html = this.buildOrderConfirmationHtml(order);
    return this.send({
      from: order.from,
      to: order.email,
      subject: 'Confirmación de pedido',
      html,
    });
  }

  buildVerifyEmailHtml(input: { displayName?: string; email: string; link: string }) {
    const name = input.displayName || input.email;
    return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#F3F4F6;padding:24px 0;margin:0">
      <tr>
        <td align="center" style="padding:0 16px">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:640px;background:#ffffff;border:1px solid rgba(59,130,246,.25);border-radius:12px;overflow:hidden">
            <tr><td style="height:4px;background:#3B82F6"></td></tr>
            <tr>
              <td style="padding:20px">
                <p style="margin:0 0 8px 0;font-family:Inter,Arial,Helvetica,sans-serif;font-size:18px;line-height:26px;font-weight:800;color:#111827">
                  Verifica tu correo
                </p>
                <p style="margin:0 0 16px 0;font-family:Inter,Arial,Helvetica,sans-serif;font-size:14px;line-height:22px;color:#4B5563">
                  Hola ${name}, haz clic en el botón para verificar tu dirección de email.
                </p>
                <a href="${input.link}" style="display:inline-block;background:#3B82F6;color:#ffffff;text-decoration:none;font-family:Inter,Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;line-height:20px;padding:10px 16px;border-radius:999px;border:1px solid #1D4ED8">Verificar email</a>
                <p style="margin:16px 0 0 0;font-family:Inter,Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:#6B7280">
                  Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
                  <span style="word-break:break-all;color:#1F2937">${input.link}</span>
                </p>
              </td>
            </tr>
          </table>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:640px;margin-top:12px">
            <tr>
              <td align="center" style="font-family:Inter,Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:#9CA3AF">
                © ${new Date().getFullYear()} NeoTech
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`;
  }

  async sendEmailVerification(input: { to: string; link: string; displayName?: string }): Promise<EmailSendResult> {
    const html = this.buildVerifyEmailHtml({ displayName: input.displayName, email: input.to, link: input.link });
    return this.send({
      to: input.to,
      subject: 'Verifica tu correo',
      html,
    });
  }
}
