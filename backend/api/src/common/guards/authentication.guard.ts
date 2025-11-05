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

type Req = Request & { user?: any; cookies?: Record<string, string> };

@Injectable()
export class AuthenticationGuard implements CanActivate {
  private readonly logger = new Logger(AuthenticationGuard.name);
  private readonly atName: string;
  private readonly rtName: string;

  constructor(
    private readonly reflector: Reflector,
    private readonly auth: AuthService,
    private readonly cfg: ConfigService,
  ) {
    this.atName = this.cfg.get<string>('cookies.atName')?.trim() || 'accessToken';
    this.rtName = this.cfg.get<string>('cookies.rtName')?.trim() || 'refreshToken';
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

    try {
      const payload = await this.auth.verifyToken(at, false);
      req.user = payload;
      this.logger.debug(`Authenticated via access token: sub=${payload?.sub ?? 'n/a'}`);
      return true;
    } catch (e: any) {
      this.logger.warn(`Access token invalid/expired: ${e?.message || e}`);
    }

    if (rt) {
      try {
        this.logger.log(`Attempting refresh with cookie '${this.rtName}'`);
        const { accessToken, refreshToken } = await this.auth.refreshWithToken(rt);

        setAuthCookies(res, this.cfg, { accessToken, refreshToken });

        const payload = await this.auth.verifyToken(accessToken, false);
        req.user = payload;
        this.logger.debug(`Authenticated via refresh: sub=${payload?.sub ?? 'n/a'}`);
        return true;
      } catch (e: any) {
        this.logger.error(`Refresh failed: ${e?.message || e}`);
      }
    } else {
      this.logger.warn(`No refresh cookie '${this.rtName}' present`);
    }

    throw new UnauthorizedException({ message: 'Unauthorized' });
  }
}
