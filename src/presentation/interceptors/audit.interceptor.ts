import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from '../../infrastructure/services/audit.service';
import { AuditAction } from '../../domain/entities/audit-log.entity';
import type { TokenPayload } from '../../infrastructure/services/auth.service';

/** HTTP methods que generan registro de auditoría */
const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Mapea el método HTTP al AuditAction correspondiente.
 */
function resolveAction(method: string): AuditAction {
  switch (method.toUpperCase()) {
    case 'POST':   return AuditAction.INSERT;
    case 'DELETE': return AuditAction.DELETE;
    default:       return AuditAction.UPDATE;
  }
}

/**
 * Extrae el nombre de la tabla a partir de la URL.
 * Ej: /products/abc-123 → "products"
 *     /sale-details      → "sale-details"
 */
function resolveTableName(url: string): string {
  const segment = url.split('?')[0].split('/').filter(Boolean)[0] ?? 'unknown';
  return segment;
}

/**
 * Extrae el recordId desde los params de la request.
 *
 * Si no hay :id en la ruta (ej: `POST /auth/login` que no es un CRUD sobre
 * un record específico), devolvemos el UUID zero en vez de `'N/A'` para
 * satisfacer la columna `record_id` (typed `uuid`, NOT NULL).
 *
 * Los consumers que quieran distinguir "audit sin record target" pueden
 * filtrar por `record_id = '00000000-0000-0000-0000-000000000000'`.
 *
 * TODO (tech debt): migrar `record_id` a nullable y devolver `null` desde
 * acá. Eso requiere una migration que ALTER TABLE audit_logs ALTER
 * COLUMN record_id DROP NOT NULL.
 */
function resolveRecordId(params: Record<string, string>): string {
  return params['id'] ?? '00000000-0000-0000-0000-000000000000';
}

/**
 * AuditInterceptor — SB-15
 *
 * Interceptor global que registra automáticamente en audit_logs
 * cada mutación (POST/PUT/PATCH/DELETE) que responde con 2xx.
 *
 * Fire-and-forget: los errores van al Logger, nunca al request.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{
      method: string;
      url: string;
      params: Record<string, string>;
      headers: Record<string, string | undefined>;
      user?: TokenPayload;
      ip?: string;
    }>();

    if (!MUTATING_METHODS.has(request.method.toUpperCase())) {
      return next.handle();
    }

    const action     = resolveAction(request.method);
    const tableName  = resolveTableName(request.url);
    const recordId   = resolveRecordId(request.params);
    const userId     = request.user?.employeeId;
    const rol        = request.user?.role;
    const ip         = request.ip ?? request.headers['x-forwarded-for'] ?? undefined;
    const userAgent  = request.headers['user-agent'] ?? undefined;

    return next.handle().pipe(
      tap(() => {
        this.auditService.audit({
          tableName,
          recordId,
          action,
          userId,
          rol,
          ip,
          userAgent,
        });
      }),
    );
  }
}
