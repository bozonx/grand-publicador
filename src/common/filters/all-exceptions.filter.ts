import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { ConfigService } from '@nestjs/config';
import type { AppConfig } from '../../config/app.config.js';
import type { FastifyReply, FastifyRequest } from 'fastify';

/**
 * Global exception filter that catches all exceptions
 * and formats them in a consistent way for Fastify responses
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    @Inject(PinoLogger) private readonly logger: PinoLogger,
    private readonly configService: ConfigService,
  ) {
    logger.setContext(AllExceptionsFilter.name);
  }

  public catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    // Preserve statusCode from non-HttpException errors (e.g., Fastify plugins)
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : typeof (exception as { statusCode?: unknown })?.statusCode === 'number'
          ? (exception as { statusCode: number }).statusCode
          : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = this.extractMessage(exception);
    const errorResponse = this.buildErrorResponse(exception);

    const appConfig = this.configService.get<AppConfig>('app')!;
    const apiBasePath = appConfig.basePath ? `${appConfig.basePath}/api/v1` : 'api/v1';

    if (status === HttpStatus.NOT_FOUND && !request.url.startsWith(`/${apiBasePath}`)) {
      void response.sendFile('index.html');
      return;
    }

    // Log error for internal tracking
    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} - ${status} - ${message}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn(`${request.method} ${request.url} - ${status} - ${message}`);
    }

    void response.status(status).send({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      error: errorResponse,
    });
  }

  private extractMessage(exception: unknown): string {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      if (typeof response === 'string') {
        return response;
      }
      if (typeof response === 'object' && response !== null && 'message' in response) {
        const msg = (response as { message: unknown }).message;
        if (Array.isArray(msg)) {
          return msg.join(', ');
        }
        if (typeof msg === 'string') {
          return msg;
        }
      }
      return exception.message;
    }

    if (exception instanceof Error) {
      return exception.message;
    }

    return 'Internal server error';
  }

  private buildErrorResponse(exception: unknown): string | object | undefined {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      if (typeof response === 'object' && response !== null) {
        return response;
      }
      return exception.name;
    }

    if (exception instanceof Error) {
      return exception.name;
    }

    return 'UnknownError';
  }
}
