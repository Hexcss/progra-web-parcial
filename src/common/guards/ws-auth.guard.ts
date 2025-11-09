// src/common/guards/ws-auth.guard.ts
import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { AuthService } from 'src/modules/auth/auth.service';

function parseCookies(cookieHeader?: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!cookieHeader) return out;
  for (const part of cookieHeader.split(';')) {
    const [k, ...rest] = part.trim().split('=');
    if (k) out[k] = decodeURIComponent(rest.join('=') || '');
  }
  return out;
}

@Injectable()
export class WsAuthGuard implements CanActivate {
  private readonly logger = new Logger(WsAuthGuard.name);

  constructor(private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient<any>();

    const cookies = parseCookies(client?.handshake?.headers?.cookie || '');
    const cookieAT = cookies['accessToken'];
    const cookieRT = cookies['refreshToken'];

    const bearer = client?.handshake?.headers?.authorization as string | undefined;
    const bearerAT = bearer?.startsWith('Bearer ') ? bearer.slice(7) : undefined;

    const authAT = client?.handshake?.auth?.token as string | undefined;

    // Prefer explicit tokens, then cookie
    const accessToken = bearerAT || authAT || cookieAT;

    if (!accessToken && !cookieRT) {
      this.logger.warn('WS auth: no access token and no refresh token present');
      throw new WsException('Unauthorized');
    }

    // 1) Try access token first
    if (accessToken) {
      try {
        const payload = await this.auth.verifyToken(accessToken, false);
        client.data = client.data || {};
        client.data.user = payload;
        return true;
      } catch (e: any) {
        this.logger.warn(`WS auth: access token rejected (${e?.message ?? 'unknown'})`);
      }
    }

    if (cookieRT) {
      try {
        const { accessToken: newAT, refreshToken: newRT, user } = await this.auth.refreshWithToken(cookieRT);
        // We can't reliably set HttpOnly cookies from a WS handshake here,
        // but we can authenticate this socket with the refreshed payload.
        client.data = client.data || {};
        client.data.user = { sub: user._id, email: user.email, role: user.role };

        // Optionally expose refreshed tokens to later stages (e.g., gateway can emit an event if you want)
        client.data.__refreshedTokens = { accessToken: newAT, refreshToken: newRT };

        this.logger.debug(`WS auth: refreshed via RT ok sub=${user._id}`);
        return true;
      } catch (e: any) {
        this.logger.error(`WS auth: refresh failed (${e?.message ?? 'unknown'})`);
      }
    } else {
      this.logger.warn('WS auth: no refresh token cookie present');
    }

    throw new WsException('Unauthorized');
  }
}
