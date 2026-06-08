import { Injectable, Inject, Logger } from '@nestjs/common';
import type { IAuditLogRepository, AuditLogEntry } from '../../domain/repositories/audit-log.repository.interface';
import { AUDIT_LOG_REPOSITORY } from '../common/injection-tokens';

/**
 * AuditService
 *
 * Provides fire-and-forget audit logging.
 * Errors are swallowed and sent to the Logger — they must never
 * propagate to the main request flow.
 *
 * Used by:
 *  - AuditInterceptor (global, HTTP layer) — SB-15 (Erick)
 *  - Individual handlers for business events (SB-16)
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @Inject(AUDIT_LOG_REPOSITORY)
    private readonly auditLogRepository: IAuditLogRepository,
  ) {}

  /**
   * Persists an audit entry asynchronously (fire-and-forget).
   * Exceptions are caught and logged — they never throw.
   */
  audit(entry: AuditLogEntry): void {
    setImmediate(() => {
      this.auditLogRepository.save(entry).catch((err: unknown) => {
        this.logger.error(
          `Failed to persist audit log for table=${entry.tableName} action=${entry.action}`,
          err instanceof Error ? err.stack : String(err),
        );
      });
    });
  }
}
