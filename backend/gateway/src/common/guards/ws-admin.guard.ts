import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';

@Injectable()
export class WsAdminGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const client = ctx.switchToWs().getClient<Socket>();
    const role = client.data?.user?.role;
    if (role === 'admin') return true;
    throw new ForbiddenException('Admin only');
  }
}
