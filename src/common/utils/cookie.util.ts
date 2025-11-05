import { Response } from 'express';
import { ConfigService } from '@nestjs/config';

export type CookieNames = { at: string; rt: string; csrf: string };

export function getCookieNames(cfg: ConfigService): CookieNames {
  return {
    at: cfg.get<string>('cookies.atName')!,
    rt: cfg.get<string>('cookies.rtName')!,
    csrf: cfg.get<string>('csrf.cookieName')!,
  };
}

export function cookieOptions(cfg: ConfigService) {
  const domain = cfg.get<string>('cookies.domain');
  const secure = !!cfg.get<boolean>('cookies.secure');
  const sameSite = cfg.get<'lax' | 'strict' | 'none'>('cookies.sameSite') ?? 'none';
  const path = cfg.get<string>('cookies.path') ?? '/';

  return { domain, secure, sameSite, path };
}

export function setAuthCookies(
  res: Response,
  cfg: ConfigService,
  tokens: { accessToken: string; refreshToken: string },
) {
  const names = getCookieNames(cfg);
  const base = cookieOptions(cfg);

  res.cookie(names.at, tokens.accessToken, {
    httpOnly: true,
    secure: base.secure,
    sameSite: base.sameSite,
    domain: base.domain,
    path: base.path,
  });

  res.cookie(names.rt, tokens.refreshToken, {
    httpOnly: true,
    secure: base.secure,
    sameSite: base.sameSite,
    domain: base.domain,
    path: base.path,
  });
}

export function clearAuthCookies(res: Response, cfg: ConfigService) {
  const names = getCookieNames(cfg);
  const base = cookieOptions(cfg);

  res.clearCookie(names.at, { domain: base.domain, path: base.path });
  res.clearCookie(names.rt, { domain: base.domain, path: base.path });
}

export function setCsrfCookie(res: Response, cfg: ConfigService, token: string) {
  const base = cookieOptions(cfg);
  const names = getCookieNames(cfg);
  // CSRF cookie is NOT httpOnly (frontend must read it and mirror in header)
  res.cookie(names.csrf, token, {
    httpOnly: false,
    secure: base.secure,
    sameSite: base.sameSite,
    domain: base.domain,
    path: base.path,
  });
}
