import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Observable, tap } from 'rxjs';
import { AppLogger } from '../logger/logger.service';
import { Request } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: AppLogger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = this.getRequest(context);
    const method = req?.method;
    const url = req?.url;
    const headers = req?.headers ?? {};
    const requestId =
      (headers['x-request-id'] as string | undefined) ?? 'no-reqid';
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;
        this.logger.log(
          {
            event: 'request_completed',
            method: method ?? 'GRAPHQL',
            url: url ?? 'graphql',
            duration,
          },
          'HTTP',
          requestId,
        );
      }),
    );
  }

  private getRequest(context: ExecutionContext): Request | undefined {
    if (context.getType<'graphql' | 'http'>() === 'graphql') {
      const gqlCtx = GqlExecutionContext.create(context).getContext<{ req?: Request }>();
      return gqlCtx.req;
    }
    return context.switchToHttp().getRequest<Request>();
  }
}
