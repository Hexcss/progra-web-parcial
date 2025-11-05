import { Request } from 'express';
import { ConfigService } from '@nestjs/config';

export function fromAccessCookie(cfg: ConfigService) {
  const atName = cfg.get<string>('cookies.atName') ?? 'at';
  return (req: Request): string | null =>
    (req as any).cookies?.[atName] ?? null;
}

export function fromRefreshCookie(cfg: ConfigService) {
  const rtName = cfg.get<string>('cookies.rtName') ?? 'rt';
  return (req: Request): string | null =>
    (req as any).cookies?.[rtName] ?? null;
}
