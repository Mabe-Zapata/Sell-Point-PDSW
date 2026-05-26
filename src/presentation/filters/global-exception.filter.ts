import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import {
  DomainException,
  EntityNotFoundException,
  DuplicateCedulaException,
  InsufficientStockException,
  BusinessRuleException,
} from '../../domain/exceptions';
import { EmailAlreadyExistsException } from '../../application/exceptions/email-already-exists.exception';
import { PasswordResetRateLimitException } from '../../application/cqrs/auth/handlers/request-password-reset/request-password-reset.handler';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Error interno del servidor';
    const timestamp = new Date().toISOString();
    const path = request.url;

    if (exception instanceof DomainException) {
      // Handle domain-specific exceptions
      if (exception instanceof EntityNotFoundException) {
        status = HttpStatus.NOT_FOUND;
        message = exception.message;
      } else if (exception instanceof DuplicateCedulaException) {
        status = HttpStatus.CONFLICT;
        message = exception.message;
      } else if (exception instanceof EmailAlreadyExistsException) {
        status = HttpStatus.CONFLICT;
        message = exception.message;
      } else if (exception instanceof InsufficientStockException) {
        status = HttpStatus.UNPROCESSABLE_ENTITY;
        message = exception.message;
      } else if (exception instanceof BusinessRuleException) {
        status = HttpStatus.UNPROCESSABLE_ENTITY;
        message = exception.message;
      } else {
        status = HttpStatus.UNPROCESSABLE_ENTITY;
        message = exception.message;
      }
    } else if (exception instanceof PasswordResetRateLimitException) {
      // Rate limit exceeded for password reset
      status = HttpStatus.TOO_MANY_REQUESTS;
      message = exception.message;
    } else if (exception instanceof HttpException) {
      // Handle NestJS HTTP exceptions
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const responseObj = exceptionResponse as Record<string, unknown>;
        if (Array.isArray(responseObj.message)) {
          message = responseObj.message.join(', ');
        } else {
          message = (responseObj.message as string) || message;
        }
      }
    } else if (exception instanceof Error) {
      // Log unhandled errors
      this.logger.error(
        `Unhandled error: ${exception.message}`,
        exception.stack,
      );
      message = 'Error interno del servidor';
    }

    response.status(status).json({
      statusCode: status,
      message,
      timestamp,
      path,
    });
  }
}
