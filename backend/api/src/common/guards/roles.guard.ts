// src/common/guards/roles.guard.ts
import { CanActivate, ExecutionContext, Injectable, ForbiddenException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from '../enums/role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);
  constructor(private reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);

    const req = ctx.switchToHttp().getRequest();
    const rid = (req.headers['x-request-id'] as string) ?? 'n/a';
    const meta = `reqId=${rid} method=${req.method} path=${req.originalUrl ?? req.url}`;
    const user = req.user as { role?: Role; sub?: string } | undefined;

    if (!required || required.length === 0) {
      this.logger.verbose(`No roles required → allowed ${meta}`);
      return true;
    }

    this.logger.debug(`Roles check: required=[${required.join(', ')}] userRole=${user?.role ?? 'n/a'} sub=${user?.sub ?? 'n/a'} ${meta}`);

    if (!user || !user.role) {
      this.logger.warn(`Roles rejected: no user or role ${meta}`);
      throw new ForbiddenException('No role found on user');
    }

    if (!required.includes(user.role)) {
      this.logger.warn(`Roles rejected: insufficient role ${meta}`);
      throw new ForbiddenException('Insufficient role');
    }

    this.logger.verbose(`Roles ok: ${meta}`);
    return true;
  }
}
