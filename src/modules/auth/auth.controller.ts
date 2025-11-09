import { Body, Controller, Get, HttpCode, Post, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
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

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly cfg: ConfigService,
  ) {}

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
}
