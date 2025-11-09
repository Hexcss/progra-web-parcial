// src/modules/auth/auth.service.ts
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Role } from '../../common/enums/role.enum';
import { verifyHash } from '../../common/crypto/argon2.util';
import { randomUUID, randomBytes } from 'node:crypto';

type Tokens = { accessToken: string; refreshToken: string };
type OAuthIntent = 'login' | 'signup';

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
    const accessSeconds = this.toSeconds(this.cfg.get<string>('jwt.accessExpires'), 15 * 60);
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
      expiresIn: 60,
    });
  }

  private generateStrongPassword(len = 32) {
    return randomBytes(len).toString('base64url');
  }

  private async oauthLoginOrSignup(
    provider: 'google' | 'github',
    profile: { email?: string | null; displayName?: string | null; providerId: string },
    intent: OAuthIntent,
  ) {
    const email = (profile.email || '').trim().toLowerCase();
    if (!email) {
      throw new UnauthorizedException(`No email returned by ${provider}. Please make your email visible/verified in ${provider}.`);
    }
    const existing = await this.users.findByEmail(email);
    if (existing) {
      const tokens = await this.signTokens(existing);
      return { user: this.publicUser(existing), ...tokens };
    }
    if (intent === 'login') {
      throw new NotFoundException('Account not found. Please sign up first.');
    }
    const password = this.generateStrongPassword(36);
    const created = await this.users.createUser({
      email,
      password,
      displayName: profile.displayName || email.split('@')[0],
    });
    const tokens = await this.signTokens(created);
    return { user: this.publicUser(created), ...tokens };
  }

  async handleGoogleCode(code: string, redirectUri: string, intent: OAuthIntent) {
    const clientId = this.cfg.getOrThrow<string>('oauth.google.clientId');
    const clientSecret = this.cfg.getOrThrow<string>('oauth.google.clientSecret');

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });
    if (!tokenRes.ok) {
      const errTxt = await tokenRes.text().catch(() => '');
      throw new UnauthorizedException(`Google token exchange failed: ${errTxt}`);
    }
    const tokenJson: any = await tokenRes.json();
    const accessToken = tokenJson.access_token as string;
    if (!accessToken) throw new UnauthorizedException('No access token from Google');

    const infoRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!infoRes.ok) {
      const errTxt = await infoRes.text().catch(() => '');
      throw new UnauthorizedException(`Google userinfo failed: ${errTxt}`);
    }
    const info: any = await infoRes.json();
    const profile = {
      providerId: String(info.sub),
      email: info.email as string | undefined,
      displayName: info.name as string | undefined,
    };

    return this.oauthLoginOrSignup('google', profile, intent);
  }

  async handleGithubCode(code: string, redirectUri: string, intent: OAuthIntent) {
    const clientId = this.cfg.getOrThrow<string>('oauth.github.clientId');
    const clientSecret = this.cfg.getOrThrow<string>('oauth.github.clientSecret');

    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    });
    if (!tokenRes.ok) {
      const errTxt = await tokenRes.text().catch(() => '');
      throw new UnauthorizedException(`GitHub token exchange failed: ${errTxt}`);
    }
    const tokenJson: any = await tokenRes.json();
    const accessToken = tokenJson.access_token as string;
    if (!accessToken) throw new UnauthorizedException('No access token from GitHub');

    const userRes = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/vnd.github+json' },
    });
    if (!userRes.ok) {
      const errTxt = await userRes.text().catch(() => '');
      throw new UnauthorizedException(`GitHub user API failed: ${errTxt}`);
    }
    const user: any = await userRes.json();

    let email: string | undefined;
    try {
      const emailsRes = await fetch('https://api.github.com/user/emails', {
        headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/vnd.github+json' },
      });
      if (emailsRes.ok) {
        const emails: Array<{ email: string; primary: boolean; verified: boolean }> = await emailsRes.json();
        const primary = emails.find((e) => e.primary && e.verified) || emails.find((e) => e.verified) || emails[0];
        email = primary?.email;
      }
    } catch {}

    const profile = {
      providerId: String(user.id),
      email: email || (user.email as string | null | undefined) || undefined,
      displayName: (user.name as string | null) || (user.login as string | null) || undefined,
    };

    return this.oauthLoginOrSignup('github', profile, intent);
  }
}
