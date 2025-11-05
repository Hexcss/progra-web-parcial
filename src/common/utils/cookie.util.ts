import { Response } from 'express';
import { ConfigService } from '@nestjs/config';

export function cookieOptions(cfg: ConfigService) {
  const domain = cfg.get<string>('cookies.domain');
  const secure = !!cfg.get<boolean>('cookies.secure');
  const sameSite = (cfg.get<'lax' | 'strict' | 'none'>('cookies.sameSite') ?? 'none') as
    | 'lax'
    | 'strict'
    | 'none';
  const path = cfg.get<string>('cookies.path') ?? '/';
  return { domain, secure, sameSite, path };
}

export function setAuthCookies(
  res: Response,
  cfg: ConfigService,
  tokens: { accessToken: string; refreshToken: string },
  opts?: { accessMaxAgeMs?: number }
) {
  const base = cookieOptions(cfg);

  res.cookie('accessToken', tokens.accessToken, {
    httpOnly: true,
    secure: base.secure,
    sameSite: base.sameSite,
    domain: base.domain,
    path: base.path,
    ...(opts?.accessMaxAgeMs ? { maxAge: opts.accessMaxAgeMs } : {}),
  });

  res.cookie('refreshToken', tokens.refreshToken, {
    httpOnly: true,
    secure: base.secure,
    sameSite: base.sameSite,
    domain: base.domain,
    path: base.path,
  });
}

export function clearAuthCookies(res: Response, cfg: ConfigService) {
  const base = cookieOptions(cfg);
  res.clearCookie('accessToken', { domain: base.domain, path: base.path });
  res.clearCookie('refreshToken', { domain: base.domain, path: base.path });
}
