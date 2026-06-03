import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  Inject,
  Optional,
} from '@nestjs/common';
import { Response } from 'express';
import {
  DomainException,
  EntityNotFoundException,
  DuplicateCedulaException,
  DuplicateUserFieldsException,
  DuplicateInvoiceForSaleException,
  InsufficientStockException,
  BusinessRuleException,
} from '../../domain/exceptions';
import { EmailAlreadyExistsException } from '../../application/exceptions/email-already-exists.exception';
import { UsernameAlreadyExistsException } from '../../application/exceptions/username-already-exists.exception';
import { CedulaAlreadyExistsException } from '../../application/exceptions/cedula-already-exists.exception';
import { PasswordResetRateLimitException } from '../../application/cqrs/auth/handlers/request-password-reset/request-password-reset.handler';
import type { IErrorLogRepository } from '../../domain/repositories';
import { ERROR_LOG_REPOSITORY } from '../../infrastructure/common/injection-tokens';
import { ErrorLog } from '../../domain/entities';
import { ExceptionType } from '../../domain/entities/enums';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  constructor(
    @Optional()
    @Inject(ERROR_LOG_REPOSITORY)
    private readonly errorLogRepository?: IErrorLogRepository,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Error interno del servidor';
    const timestamp = new Date().toISOString();
    const path = request.url as string;

    if (exception instanceof DomainException) {
      if (exception instanceof EntityNotFoundException) {
        status = HttpStatus.NOT_FOUND;
        message = exception.message;
      } else if (exception instanceof DuplicateCedulaException) {
        status = HttpStatus.CONFLICT;
        message = exception.message;
      } else if (exception instanceof DuplicateUserFieldsException) {
        status = HttpStatus.CONFLICT;
        message = exception.message;
      } else if (exception instanceof DuplicateInvoiceForSaleException) {
        status = HttpStatus.CONFLICT;
        message = exception.message;
      } else if (exception instanceof EmailAlreadyExistsException) {
        status = HttpStatus.CONFLICT;
        message = exception.message;
      } else if (exception instanceof UsernameAlreadyExistsException) {
        status = HttpStatus.CONFLICT;
        message = exception.message;
      } else if (exception instanceof CedulaAlreadyExistsException) {
        status = HttpStatus.CONFLICT;
        message = exception.message;
      } else if (exception instanceof InsufficientStockException) {
        status = HttpStatus.CONFLICT;
        message = exception.message;
      } else if (exception instanceof BusinessRuleException) {
        status = HttpStatus.UNPROCESSABLE_ENTITY;
        message = exception.message;
      } else {
        status = HttpStatus.UNPROCESSABLE_ENTITY;
        message = exception.message;
      }
    } else if (exception instanceof PasswordResetRateLimitException) {
      status = HttpStatus.TOO_MANY_REQUESTS;
      message = exception.message;
    } else if (exception instanceof HttpException) {
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
      this.logger.error(
        `Unhandled error: ${exception.message}`,
        exception.stack,
      );
      message = 'Error interno del servidor';
    }

    // Solo persiste errores relevantes: no guarda 404s ni errores de validación (400)
    // para evitar llenar la tabla con ruido. Persiste errores de servidor (500) y
    // errores de dominio no controlados.
    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.persistError(exception, path, status);
    }

    const payload: Record<string, unknown> = {
      statusCode: status,
      message,
      timestamp,
      path,
    };

    if (exception instanceof DuplicateUserFieldsException) {
      payload.errors = exception.errors;
    }

    response.status(status).json(payload);
  }

  private persistError(exception: unknown, source: string, status: number): void {
    if (!this.errorLogRepository) return;

    const exceptionType = this.resolveExceptionType(status);
    const message =
      exception instanceof Error ? exception.message : String(exception);
    const stackTrace =
      exception instanceof Error ? exception.stack : undefined;

    const errorLog = new ErrorLog({
      exceptionType,
      message,
      stackTrace,
      source,
    });

    // Fire-and-forget: no esperamos la promesa para no bloquear la respuesta HTTP.
    // Si falla la persistencia, solo se loguea — nunca afecta al usuario.
    this.errorLogRepository.create(errorLog).catch((err: unknown) => {
      this.logger.error(
        'Failed to persist error log',
        err instanceof Error ? err.stack : String(err),
      );
    });
  }

  private resolveExceptionType(status: number): ExceptionType {
    if (status === HttpStatus.UNAUTHORIZED || status === HttpStatus.FORBIDDEN) {
      return ExceptionType.AUTHENTICATION_ERROR;
    }
    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      return ExceptionType.UNEXPECTED_ERROR;
    }
    return ExceptionType.BUSINESS_RULE_ERROR;
  }
}
