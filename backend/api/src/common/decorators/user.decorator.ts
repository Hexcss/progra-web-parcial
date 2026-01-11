import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  if (ctx.getType<'graphql' | 'http'>() === 'graphql') {
    const gqlCtx = GqlExecutionContext.create(ctx).getContext<{ req?: { user?: any } }>();
    return gqlCtx.req?.user;
  }
  const req = ctx.switchToHttp().getRequest();
  return req.user;
});
