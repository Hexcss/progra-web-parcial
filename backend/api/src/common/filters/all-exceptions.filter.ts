import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppLogger } from '../logger/logger.service';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: AppLogger) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const { status, messages } = this.describeException(exception);

    if (host.getType<'graphql' | 'http'>() === 'graphql') {
      this.logger.error(
        {
          event: 'exception',
          status,
          messages,
          path: 'graphql',
          method: 'GRAPHQL',
          stack: exception instanceof Error ? exception.stack : undefined,
        },
        exception instanceof Error ? exception.stack : undefined,
        'ExceptionFilter',
      );
      return exception as any;
    }

    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    this.logger.error(
      {
        event: 'exception',
        status,
        messages,
        path: request.url,
        method: request.method,
        requestId: request.headers['x-request-id'] as string | undefined,
        stack: exception instanceof Error ? exception.stack : undefined,
      },
      exception instanceof Error ? exception.stack : undefined,
      'ExceptionFilter',
    );

    response.status(status).json({
      statusCode: status,
      errors: messages,
      path: request.url,
      timestamp: new Date().toISOString(),
      requestId: request.headers['x-request-id'] as string | undefined,
    });
  }

  private describeException(exception: unknown) {
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let messages: string[] = ['Internal server error'];

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        messages = [res];
      } else if (typeof res === 'object' && res !== null) {
        const resObj = res as Record<string, unknown>;
        const messageField = resObj['message'];
        if (typeof messageField === 'string') {
          messages = [messageField];
        } else if (
          Array.isArray(messageField) &&
          messageField.every((m) => typeof m === 'string')
        ) {
          messages = messageField;
        }
      }
    } else if (exception instanceof ZodError) {
      status = HttpStatus.BAD_REQUEST;
      messages = exception.issues.map(
        (issue) => `${issue.path.join('.')}: ${issue.message}`,
      );
    } else if (exception instanceof Error) {
      messages = [exception.message];
    }

    return { status, messages };
  }
}
