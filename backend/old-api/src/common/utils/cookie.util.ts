// src/common/utils/cookie.util.ts
import type { Response } from 'express';
import { ConfigService } from '@nestjs/config';

type CookieSameSite = 'lax' | 'strict' | 'none';

function toMs(v: string | number | undefined, fallbackMs: number) {
  if (typeof v === 'number') return v * 1000;
  const s = (v ?? '').toString().trim();
  if (!s) return fallbackMs;
  const m = /^(\d+)\s*(ms|s|m|h|d)?$/i.exec(s);
  if (!m) return fallbackMs;
  const n = parseInt(m[1], 10);
  const u = (m[2] || 's').toLowerCase();
  const mult = u === 'ms' ? 1 : u === 's' ? 1000 : u === 'm' ? 60000 : u === 'h' ? 3600000 : 86400000;
  return n * mult;
}

export function setAuthCookies(
  res: Response,
  cfg: ConfigService,
  tokens: { accessToken: string; refreshToken: string },
) {
  const nodeEnv = (cfg.get<string>('NODE_ENV') || process.env.NODE_ENV || 'development').toLowerCase();
  const secure = (cfg.get<string>('COOKIE_SECURE') ?? (nodeEnv === 'production' ? 'true' : 'false')) === 'true';
  const sameSite = ((cfg.get<string>('COOKIE_SAMESITE') || 'lax').toLowerCase() as CookieSameSite);
  const domain = (cfg.get<string>('COOKIE_DOMAIN') || '').trim() || undefined; // do NOT include a port

  const base = {
    httpOnly: true,
    secure: sameSite === 'none' ? true : secure, // SameSite=None requires Secure
    sameSite: sameSite as CookieSameSite,
    path: '/',
    ...(domain ? { domain } : {}), // omit in localhost/dev
  } as const;

  res.cookie('accessToken', tokens.accessToken, {
    ...base,
    maxAge: toMs(cfg.get('JWT_ACCESS_EXPIRES'), 15 * 60 * 1000),
  });

  res.cookie('refreshToken', tokens.refreshToken, {
    ...base,
    maxAge: toMs(cfg.get('JWT_REFRESH_EXPIRES'), 7 * 24 * 60 * 60 * 1000),
  });
}

export function clearAuthCookies(res: Response, cfg: ConfigService) {
  const nodeEnv = (cfg.get<string>('NODE_ENV') || process.env.NODE_ENV || 'development').toLowerCase();
  const secure = (cfg.get<string>('COOKIE_SECURE') ?? (nodeEnv === 'production' ? 'true' : 'false')) === 'true';
  const sameSite = ((cfg.get<string>('COOKIE_SAMESITE') || 'lax').toLowerCase() as CookieSameSite);
  const domain = (cfg.get<string>('COOKIE_DOMAIN') || '').trim() || undefined;

  const base = {
    httpOnly: true,
    secure: sameSite === 'none' ? true : secure,
    sameSite: sameSite as CookieSameSite,
    path: '/',
    ...(domain ? { domain } : {}),
    maxAge: 0,
  } as const;

  res.cookie('accessToken', '', base);
  res.cookie('refreshToken', '', base);
}
