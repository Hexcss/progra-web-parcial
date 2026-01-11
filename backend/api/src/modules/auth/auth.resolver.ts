import { Args, Context, Mutation, Query, Resolver, ObjectType, Field } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { clearAuthCookies, setAuthCookies } from '../../common/utils/cookie.util';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { SessionPayload, DeleteResponse, EmailStatus } from '../../common/graphql/types';
import { User } from '../users/entities/user.entity';

type GqlContext = { req: Request; res: Response };

@ObjectType()
class AuthResponse {
  @Field(() => User)
  user!: User;

  @Field(() => EmailStatus, { nullable: true })
  verificationEmail?: EmailStatus | null;
}

@Resolver()
export class AuthResolver {
  constructor(
    private readonly auth: AuthService,
    private readonly cfg: ConfigService,
  ) {}

  @Public()
  @Mutation(() => AuthResponse)
  async register(@Args('input') dto: RegisterDto, @Context() ctx: GqlContext) {
    const result = await this.auth.register(dto.email, dto.password, dto.displayName);
    setAuthCookies(ctx.res, this.cfg, {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
    const origin = this.resolveServerOrigin(ctx.req);
    const verificationEmail = await this.auth.maybeSendEmailVerification(result.user, origin);
    return { user: result.user, verificationEmail };
  }

  @Public()
  @Mutation(() => AuthResponse)
  async login(@Args('input') dto: LoginDto, @Context() ctx: GqlContext) {
    const result = await this.auth.login(dto.email, dto.password);
    setAuthCookies(ctx.res, this.cfg, {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
    return { user: result.user };
  }

  @Query(() => SessionPayload)
  session(@CurrentUser() user: any) {
    return { sub: user.sub, email: user.email, role: user.role };
  }

  @Mutation(() => DeleteResponse)
  async logout(@Context() ctx: GqlContext) {
    await this.auth.logout();
    clearAuthCookies(ctx.res, this.cfg);
    return { success: true };
  }

  @Query(() => String)
  async wsTicket(@CurrentUser() user: any) {
    return this.auth.createWsTicket(user);
  }

  private resolveServerOrigin(req: Request) {
    const xfProto = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'http';
    const xfHost = (req.headers['x-forwarded-host'] as string) || req.get('host');
    const host = xfHost || this.cfg.get<string>('publicHost');
    const proto = xfProto || 'http';
    return `${proto}://${host}`;
  }
}
