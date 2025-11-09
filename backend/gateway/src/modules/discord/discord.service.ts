import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type NewSupportRoomPayload = {
  roomId: string;
  customerId: string;
  createdAt: Date;
  initialMessage?: string | null;
  roomUrl?: string | null;
};

@Injectable()
export class DiscordService {
  private readonly logger = new Logger(DiscordService.name);
  private readonly webhookUrl?: string;
  private readonly timeoutMs: number;
  private readonly botName?: string;
  private readonly botAvatarUrl?: string;

  constructor(private readonly cfg: ConfigService) {
    this.webhookUrl = this.cfg.get<string>('supportWebhook') || undefined;
    this.timeoutMs = 4000;
    this.botName = this.cfg.get<string>('supportWebhookName') || 'Soporte';
    this.botAvatarUrl = this.cfg.get<string>('supportWebhookAvatar') || undefined;
  }

  private sanitize(text: string) {
    return text
      .replace(/```/g, 'ʼʼʼ')
      .replace(/@/g, '@\u200b')
      .trim();
  }

  private truncate(text: string, max = 3500) {
    if (text.length <= max) return text;
    return text.slice(0, max - 1) + '…';
  }

  async notifyNewSupportRoom(payload: NewSupportRoomPayload): Promise<void> {
    if (!this.webhookUrl) return;

    const ts = Math.floor(payload.createdAt.getTime() / 1000);
    const hasMsg = !!payload.initialMessage && payload.initialMessage.trim().length > 0;
    const msgBlock = hasMsg
      ? `\n**Mensaje inicial**\n\`\`\`\n${this.truncate(this.sanitize(payload.initialMessage!))}\n\`\`\``
      : '';

    const embeds = [
      {
        title: '🆕 Nuevo chat de soporte',
        color: 0x3b82f6,
        description: msgBlock || undefined,
        fields: [
          {
            name: 'Sala',
            value:
              '`' +
              payload.roomId +
              '`' +
              (payload.roomUrl ? ` • [Abrir](${payload.roomUrl})` : ''),
            inline: true,
          },
          { name: 'Usuario', value: '`' + payload.customerId + '`', inline: true },
          { name: 'Hora', value: `<t:${ts}:F>`, inline: true },
        ],
        timestamp: payload.createdAt.toISOString(),
        footer: { text: 'Soporte' },
      },
    ];

    const controller = new AbortController();
    const to = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: this.botName,
          avatar_url: this.botAvatarUrl,
          content: '',
          embeds,
          allowed_mentions: { parse: [] },
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        this.logger.warn(`notifyNewSupportRoom non-2xx status=${res.status} body=${txt}`);
      } else {
        this.logger.log(`notifyNewSupportRoom ok room=${payload.roomId}`);
      }
    } catch (e: any) {
      this.logger.warn(`notifyNewSupportRoom failed: ${e?.message || e}`);
    } finally {
      clearTimeout(to);
    }
  }
}
