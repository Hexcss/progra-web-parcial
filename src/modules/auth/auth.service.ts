// src/modules/auth/auth.service.ts
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Role } from '../../common/enums/role.enum';
import { verifyHash } from '../../common/crypto/argon2.util';
import { randomUUID } from 'node:crypto';

type Tokens = { accessToken: string; refreshToken: string };

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly cfg: ConfigService,
  ) {}

  private toSeconds(v: string | undefined, fallbackSeconds: number): number {
    const s = (v ?? '').trim();
    if (!s) return fallbackSeconds;
    const asNum = Number(s);
    if (Number.isFinite(asNum)) return asNum;
    const m = /^(\d+)\s*([smhd])$/i.exec(s);
    if (!m) return fallbackSeconds;
    const n = parseInt(m[1], 10);
    const mult = m[2].toLowerCase() === 's' ? 1 : m[2].toLowerCase() === 'm' ? 60 : m[2].toLowerCase() === 'h' ? 3600 : 86400;
    return n * mult;
  }

  private async signTokens(user: { _id: any; email: string; role: Role }): Promise<Tokens> {
    const payload = { sub: String(user._id), email: user.email, role: user.role };

    const accessSeconds  = this.toSeconds(this.cfg.get<string>('jwt.accessExpires'), 15 * 60);
    const refreshSeconds = this.toSeconds(this.cfg.get<string>('jwt.refreshExpires'), 7 * 86400);

    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.cfg.getOrThrow<string>('jwt.accessSecret'),
      expiresIn: accessSeconds,
    });

    const refreshToken = await this.jwt.signAsync(payload, {
      secret: this.cfg.getOrThrow<string>('jwt.refreshSecret'),
      expiresIn: refreshSeconds,
    });

    return { accessToken, refreshToken };
  }

  private publicUser(u: any) {
    return {
      _id: String(u._id),
      email: u.email,
      displayName: u.displayName,
      role: u.role,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    };
  }

  async verifyToken(token: string, isRefresh = false): Promise<any> {
    if (!token) {
      this.logger.warn('No token provided for verification');
      throw new UnauthorizedException('Token is missing');
    }
    const secret = isRefresh
      ? this.cfg.getOrThrow<string>('jwt.refreshSecret')
      : this.cfg.getOrThrow<string>('jwt.accessSecret');

    try {
      const decoded = await this.jwt.verifyAsync(token, { secret });
      this.logger.debug(`Token verified (${isRefresh ? 'refresh' : 'access'}): sub=${decoded?.sub}, role=${decoded?.role}`);
      return decoded;
    } catch (err: any) {
      this.logger.error(`Token verification failed: ${err?.name ?? 'Error'} - ${err?.message ?? ''}`);
      if (err?.name === 'TokenExpiredError') throw new UnauthorizedException('Token expired');
      if (err?.name === 'JsonWebTokenError') throw new UnauthorizedException('Invalid token');
      throw new BadRequestException('Could not verify token');
    }
  }

  /** 🔁 Firebase-like refresh: verify refresh token, then issue a new pair (rotate). */
  async refreshWithToken(refreshToken: string): Promise<Tokens & { user: any }> {
    const decoded = await this.verifyToken(refreshToken, true);
    const userPayload = { _id: decoded.sub, email: decoded.email, role: decoded.role as Role };
    const tokens = await this.signTokens(userPayload);
    return { ...tokens, user: this.publicUser(userPayload) };
  }

  async register(email: string, password: string, displayName: string) {
    const normEmail = email.trim().toLowerCase();
    const user = await this.users.createUser({ email: normEmail, password, displayName });
    const tokens = await this.signTokens(user);
    // no server-side RT persistence anymore
    return { user: this.publicUser(user), ...tokens };
  }

  async login(email: string, password: string) {
    const normEmail = email.trim().toLowerCase();
    const user = await this.users.findByEmail(normEmail);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const ok = await verifyHash(user.passwordHash, password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    const tokens = await this.signTokens(user);
    return { user: this.publicUser(user), ...tokens };
  }

  async logout() {
    return { success: true };
  }

  async createWsTicket(user: { sub: string; email: string; role: Role }): Promise<string> {
    const payload = {
      sub: user.sub,
      email: user.email,
      role: user.role,
      aud: 'ws',
      typ: 'ws',
      jti: randomUUID(),
    };
    return this.jwt.signAsync(payload, {
      secret: this.cfg.getOrThrow<string>('jwt.accessSecret'),
      expiresIn: 60, // 60s ticket
    });
  }
}
