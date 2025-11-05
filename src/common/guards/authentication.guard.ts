import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request, Response } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AuthService } from '../../modules/auth/auth.service';
import { ConfigService } from '@nestjs/config';
import { setAuthCookies } from '../utils/cookie.util';

type Req = Request & { user?: any; cookies?: Record<string, string>; id?: string };

@Injectable()
export class AuthenticationGuard implements CanActivate {
  private readonly logger = new Logger(AuthenticationGuard.name);
  private readonly atName: string;
  private readonly rtName: string;
  private readonly debugEnabled: boolean;

  constructor(
    private readonly reflector: Reflector,
    private readonly auth: AuthService,
    private readonly cfg: ConfigService,
  ) {
    this.atName = 'accessToken';
    this.rtName = 'refreshToken';
    const env = this.cfg.get<string>('NODE_ENV');
    const flag = this.cfg.get<string>('LOG_AUTH_DEBUG');
    this.debugEnabled = env !== 'production' || flag === 'true';
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const http = context.switchToHttp();
    const req = http.getRequest<Req>();
    const res = http.getResponse<Response>();
    const cookies = req.cookies ?? {};

    const at = cookies[this.atName];
    const rt = cookies[this.rtName];

    const meta = this.buildMeta(req);

    if (at) {
      try {
        const payload = await this.auth.verifyToken(at, false);
        req.user = payload;
        if (this.debugEnabled) this.logger.debug(`auth ok via access token sub=${payload?.sub ?? 'n/a'} ${meta}`);
        return true;
      } catch (e: any) {
        this.logger.warn(`access token rejected reason=${e?.message ?? 'unknown'} ${meta}`);
      }
    } else {
      if (this.debugEnabled) this.logger.debug(`no access token cookie ${meta}`);
    }

    if (rt) {
      try {
        if (this.debugEnabled) this.logger.debug(`attempting refresh ${meta}`);
        const { accessToken, refreshToken } = await this.auth.refreshWithToken(rt);
        setAuthCookies(res, this.cfg, { accessToken, refreshToken });
        const payload = await this.auth.verifyToken(accessToken, false);
        req.user = payload;
        if (this.debugEnabled) this.logger.debug(`auth ok via refresh sub=${payload?.sub ?? 'n/a'} ${meta}`);
        return true;
      } catch (e: any) {
        this.logger.error(`refresh failed reason=${e?.message ?? 'unknown'} ${meta}`);
      }
    } else {
      if (this.debugEnabled) this.logger.debug(`no refresh token cookie ${meta}`);
    }

    this.logger.warn(`unauthorized ${meta}`);
    throw new UnauthorizedException({ message: 'Unauthorized' });
  }

  private buildMeta(req: Req): string {
    const rid = (req.headers['x-request-id'] as string) || req.id || '-';
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      (req.socket && (req.socket as any).remoteAddress) ||
      (req as any).ip ||
      '-';
    const m = req.method || '-';
    const p = (req as any).originalUrl || req.url || '-';
    return `rid=${rid} m=${m} p=${p} ip=${ip}`;
  }
}
