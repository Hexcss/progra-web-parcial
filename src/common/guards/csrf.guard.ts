// src/common/guards/csrf.guard.ts
import { CanActivate, ExecutionContext, ForbiddenException, Injectable, Logger } from '@nestjs/common';
import type { Request } from 'express';
import { ConfigService } from '@nestjs/config';

const SAFE = new Set(['GET', 'HEAD', 'OPTIONS']);

@Injectable()
export class CsrfGuard implements CanActivate {
  private readonly logger = new Logger(CsrfGuard.name);
  constructor(private readonly cfg: ConfigService) {}

  canActivate(ctx: ExecutionContext): boolean {
    const req: Request = ctx.switchToHttp().getRequest();
    const rid = (req.headers['x-request-id'] as string) ?? 'n/a';
    const meta = `reqId=${rid} method=${req.method} path=${req.originalUrl ?? req.url}`;
    if (SAFE.has(req.method)) {
      this.logger.verbose(`SAFE method allowed: ${meta}`);
      return true;
    }

    const header = req.get('x-csrf-token') || req.get('X-CSRF-Token');
    const cookieName = this.cfg.get<string>('csrf.cookieName') ?? 'csrfToken';
    const cookie = (req as any).cookies?.[cookieName];

    this.logger.debug(`CSRF check: headerPresent=${Boolean(header)} cookiePresent=${Boolean(cookie)} cookieName=${cookieName} ${meta}`);

    if (!header || !cookie) {
      this.logger.warn(`CSRF rejected: missing header or cookie ${meta}`);
      throw new ForbiddenException('Invalid CSRF token');
    }
    if (header !== cookie) {
      this.logger.warn(`CSRF rejected: mismatch ${meta}`);
      throw new ForbiddenException('Invalid CSRF token');
    }

    this.logger.verbose(`CSRF ok: ${meta}`);
    return true;
  }
}
