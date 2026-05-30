// src/modules/auth/auth.controller.ts
import {
  BadRequestException,
  Controller,
  Get,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { randomBytes } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { Public } from '../../common/decorators/public.decorator';
import { setAuthCookies } from '../../common/utils/cookie.util';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly cfg: ConfigService,
  ) {}

  private isProd() {
    const v = (this.cfg.get<string>('NODE_ENV') || process.env.NODE_ENV || '').toLowerCase();
    return v === 'production';
  }

  private cookieBaseOptions() {
    return {
      httpOnly: true as const,
      sameSite: 'lax' as const,
      secure: this.isProd(),
      path: '/',
      maxAge: 10 * 60 * 1000,
    };
  }

  private getClientUrl(): string {
    const explicit = this.cfg.get<string>('clientUrl');
    if (explicit) return explicit;
    const origins = (this.cfg.get<string>('CORS_ORIGIN') ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    return origins[0] || 'http://localhost:5173';
  }

  private resolveServerOrigin(req: Request) {
    const xfProto = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'http';
    const xfHost = (req.headers['x-forwarded-host'] as string) || req.get('host');
    const host = xfHost || this.cfg.get<string>('publicHost');
    const proto = xfProto || 'http';
    return `${proto}://${host}`;
  }

  @Public()
  @Get('verify-email')
  async verifyEmail(@Res() res: Response, @Query('token') token?: string) {
    if (!token) throw new BadRequestException('Missing token');
    await this.auth.verifyEmailToken(token);
    const url = this.getClientUrl() + '/market';
    return res.redirect(303, url);
  }

  @Public()
  @Get('oauth/google/start')
  async googleStart(
    @Req() req: Request,
    @Res() res: Response,
    @Query('intent') intent: 'login' | 'signup' = 'login',
  ) {
    const origin = this.resolveServerOrigin(req);
    const redirectUri = `${origin}/auth/oauth/google/callback`;
    const clientId = this.cfg.getOrThrow<string>('oauth.google.clientId');
    const scope = encodeURIComponent('openid email profile');
    const state = randomBytes(16).toString('hex');
    const url =
      `https://accounts.google.com/o/oauth2/v2/auth` +
      `?client_id=${encodeURIComponent(clientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code` +
      `&scope=${scope}` +
      `&access_type=online` +
      `&include_granted_scopes=true` +
      `&state=${encodeURIComponent(state)}`;

    res.cookie('oauth_state', state, this.cookieBaseOptions());
    res.cookie('oauth_intent', intent, this.cookieBaseOptions());
    return res.redirect(url);
  }

  @Public()
  @Get('oauth/google/callback')
  async googleCallback(@Req() req: Request, @Res() res: Response, @Query('code') code?: string, @Query('state') state?: string) {
    const savedState = req.cookies?.['oauth_state'];
    const intent = (req.cookies?.['oauth_intent'] as 'login' | 'signup') || 'login';
    res.clearCookie('oauth_state');
    res.clearCookie('oauth_intent');

    if (!code || !state || !savedState || savedState !== state) {
      throw new BadRequestException('Invalid OAuth state');
    }

    const origin = this.resolveServerOrigin(req);
    const redirectUri = `${origin}/auth/oauth/google/callback`;
    const { accessToken, refreshToken } = await this.auth.handleGoogleCode(code, redirectUri, intent);

    setAuthCookies(res, this.cfg, { accessToken, refreshToken });
    return res.redirect(303, this.getClientUrl() + '/');
  }

  @Public()
  @Get('oauth/github/start')
  async githubStart(
    @Req() req: Request,
    @Res() res: Response,
    @Query('intent') intent: 'login' | 'signup' = 'login',
  ) {
    const origin = this.resolveServerOrigin(req);
    const redirectUri = `${origin}/auth/oauth/github/callback`;
    const clientId = this.cfg.getOrThrow<string>('oauth.github.clientId');
    const scope = encodeURIComponent('read:user user:email');
    const state = randomBytes(16).toString('hex');
    const url =
      `https://github.com/login/oauth/authorize` +
      `?client_id=${encodeURIComponent(clientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${scope}` +
      `&state=${encodeURIComponent(state)}`;

    res.cookie('oauth_state', state, this.cookieBaseOptions());
    res.cookie('oauth_intent', intent, this.cookieBaseOptions());
    return res.redirect(url);
  }

  @Public()
  @Get('oauth/github/callback')
  async githubCallback(@Req() req: Request, @Res() res: Response, @Query('code') code?: string, @Query('state') state?: string) {
    const savedState = req.cookies?.['oauth_state'];
    const intent = (req.cookies?.['oauth_intent'] as 'login' | 'signup') || 'login';
    res.clearCookie('oauth_state');
    res.clearCookie('oauth_intent');

    if (!code || !state || !savedState || savedState !== state) {
      throw new BadRequestException('Invalid OAuth state');
    }

    const origin = this.resolveServerOrigin(req);
    const redirectUri = `${origin}/auth/oauth/github/callback`;
    const { accessToken, refreshToken } = await this.auth.handleGithubCode(code, redirectUri, intent);

    setAuthCookies(res, this.cfg, { accessToken, refreshToken });
    return res.redirect(303, this.getClientUrl() + '/');
  }
}
