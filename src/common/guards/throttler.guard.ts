import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class GqlThrottlerGuard extends ThrottlerGuard {
  protected getRequestResponse(context: ExecutionContext) {
    if (context.getType<'graphql' | 'http'>() === 'graphql') {
      const gqlCtx = GqlExecutionContext.create(context).getContext();
      return { req: gqlCtx.req, res: gqlCtx.res };
    }
    return super.getRequestResponse(context);
  }
}
