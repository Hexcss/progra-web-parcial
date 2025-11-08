// src/common/ws-auth.guard.ts
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Socket } from 'socket.io';
import * as cookie from 'cookie';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import type { Role } from '../enums/role.enum';

type JwtPayload = { sub: string; email?: string; role?: Role; iat?: number; exp?: number };

@Injectable()
export class WsAuthGuard implements CanActivate {
  constructor(private readonly cfg: ConfigService) {}
  canActivate(ctx: ExecutionContext): boolean {
    const client = ctx.switchToWs().getClient<Socket>();
    const cookies = cookie.parse(client.handshake.headers.cookie || '');
    const token = cookies['accessToken'] || (client.handshake.auth && (client.handshake.auth as any).token) || client.handshake.query['token'];
    if (!token || typeof token !== 'string') throw new UnauthorizedException('Missing token');
    const secret = this.cfg.get<string>('JWT_ACCESS_SECRET') || '';
    try {
      const payload = jwt.verify(token, secret) as JwtPayload;
      (client.data ||= {}).user = { sub: payload.sub, email: payload.email, role: payload.role || 'user' };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
