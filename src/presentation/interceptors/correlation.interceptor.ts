import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CorrelationInterceptor implements NestInterceptor {
  private readonly logger = new Logger('CorrelationInterceptor');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    
    // Capturar o generar Correlation ID
    const correlationId = request.headers['x-correlation-id'] || uuidv4();
    request['correlationId'] = correlationId;

    // Inyectar en la respuesta para que el cliente pueda rastrear su request
    const response = context.switchToHttp().getResponse();
    response.setHeader('X-Correlation-Id', correlationId);

    this.logger.log(`Request received: ${request.method} ${request.url} | CorrelationId: ${correlationId}`);

    return next.handle().pipe(
      tap(() => {
        this.logger.log(`Request completed: ${request.method} ${request.url} | CorrelationId: ${correlationId}`);
      }),
    );
  }
}
