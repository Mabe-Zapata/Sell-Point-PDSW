import { GetAuditLogQuery } from './get-audit-log.query';
import type { IAuditLogRepository } from '../../../../../domain/repositories/audit-log.repository.interface';
import { AuditLog } from '../../../../../domain/entities/audit-log.entity';

export class GetAuditLogHandler {
  constructor(
    protected readonly auditLogRepository: IAuditLogRepository,
  ) {}

  async execute(query: GetAuditLogQuery): Promise<AuditLog | null> {
    return this.auditLogRepository.findById(query.id);
  }
}
