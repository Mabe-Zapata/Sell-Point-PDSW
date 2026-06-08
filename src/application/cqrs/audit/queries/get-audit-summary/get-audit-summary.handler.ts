import { GetAuditSummaryQuery } from './get-audit-summary.query';
import type { IAuditLogRepository, AuditSummary } from '../../../../../domain/repositories/audit-log.repository.interface';

export class GetAuditSummaryHandler {
  constructor(
    protected readonly auditLogRepository: IAuditLogRepository,
  ) {}

  async execute(_query: GetAuditSummaryQuery): Promise<AuditSummary> {
    return this.auditLogRepository.getSummary();
  }
}
