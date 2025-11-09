// src/modules/auth/auth.controller.ts
import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  Res,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ConfigService } from '@nestjs/config';
import type { Response, Request } from 'express';
import { clearAuthCookies, setAuthCookies } from '../../common/utils/cookie.util';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { AuthenticationGuard } from '../../common/guards/authentication.guard';
import {
  ApiBody,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { randomBytes } from 'crypto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly cfg: ConfigService,
  ) { }

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

  @ApiOperation({ summary: 'Register user and set auth cookies' })
  @ApiBody({ type: RegisterDto })
  @ApiCreatedResponse({
    schema: {
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            email: { type: 'string', format: 'email' },
            displayName: { type: 'string', nullable: true },
            role: { type: 'string', enum: ['user', 'admin'] },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  })
  @Public()
  @Post('register')
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.auth.register(dto.email, dto.password, dto.displayName);
    setAuthCookies(res, this.cfg, {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
    return { user: result.user };
  }

  @ApiOperation({ summary: 'Login and set auth cookies' })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            email: { type: 'string', format: 'email' },
            displayName: { type: 'string', nullable: true },
            role: { type: 'string', enum: ['user', 'admin'] },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  })
  @Public()
  @HttpCode(200)
  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.auth.login(dto.email, dto.password);
    setAuthCookies(res, this.cfg, {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
    return { user: result.user };
  }

  @ApiCookieAuth('accessToken')
  @ApiOperation({ summary: 'Get current session payload' })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        sub: { type: 'string' },
        email: { type: 'string', format: 'email' },
        role: { type: 'string', enum: ['user', 'admin'] },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @UseGuards(AuthenticationGuard)
  @Get('me')
  async me(@CurrentUser() user: any) {
    return { sub: user.sub, email: user.email, role: user.role };
  }

  @ApiCookieAuth('accessToken')
  @ApiOperation({ summary: 'Logout and clear cookies' })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: { success: { type: 'boolean' } },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @UseGuards(AuthenticationGuard)
  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    await this.auth.logout();
    clearAuthCookies(res, this.cfg);
    return { success: true };
  }

  @Get('ws-ticket')
  async getWsTicket(@CurrentUser() user: any) {
    const token = await this.auth.createWsTicket(user);
    return { token };
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
