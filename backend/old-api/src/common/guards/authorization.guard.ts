// src/common/authorization.guard.ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';;
import { GqlExecutionContext } from '@nestjs/graphql';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { MIN_ROLE_KEY } from '../decorators/role.decorator';
import { Role, RoleLevelMap } from '../enums/role.enum';

type ReqUser = { sub?: string; email?: string; role?: Role };

@Injectable()
export class AuthorizationGuard implements CanActivate {
  private readonly logger = new Logger(AuthorizationGuard.name);

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const requiredLevel = this.reflector.getAllAndOverride<number>(MIN_ROLE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredLevel) return true;

    const req = this.getRequest(context);
    const user = req.user;

    const meta = `method=${req.method} path=${req.originalUrl ?? req.url}`;
    if (!user) {
      this.logger.warn(`No authenticated user on request (${meta})`);
      throw new UnauthorizedException('Missing authenticated user');
    }

    if (!user.role) {
      this.logger.warn(`Authenticated user has no role (${meta}) sub=${user.sub ?? 'n/a'}`);
      throw new ForbiddenException('No role found on user');
    }

    const currentLevel = RoleLevelMap[user.role];
    if (currentLevel === undefined) {
      this.logger.warn(`Unknown role "${user.role}" (${meta}) sub=${user.sub ?? 'n/a'}`);
      throw new ForbiddenException('Invalid user role');
    }

    if (currentLevel < requiredLevel) {
      this.logger.warn(
        `Access denied: role=${user.role}(${currentLevel}) < required(${requiredLevel}) (${meta}) sub=${user.sub ?? 'n/a'}`,
      );
      throw new ForbiddenException('Insufficient role');
    }

    this.logger.debug(
      `Access granted: role=${user.role}(${currentLevel}) >= required(${requiredLevel}) (${meta}) sub=${user.sub ?? 'n/a'}`,
    );
    return true;
  }

  private getRequest(context: ExecutionContext) {
    if (context.getType<'graphql' | 'http'>() === 'graphql') {
      const gqlCtx = GqlExecutionContext.create(context).getContext<{ req: Request & { user?: ReqUser } }>();
      return gqlCtx.req;
    }
    return context.switchToHttp().getRequest<Request & { user?: ReqUser }>();
  }
}
