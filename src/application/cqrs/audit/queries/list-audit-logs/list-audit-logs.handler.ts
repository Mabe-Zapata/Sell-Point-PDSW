import { ListAuditLogsQuery } from './list-audit-logs.query';
import type { IAuditLogRepository } from '../../../../../domain/repositories/audit-log.repository.interface';
import type { PaginatedResult } from '../../../../../domain/repositories/pagination.types';
import { AuditLog } from '../../../../../domain/entities/audit-log.entity';

export class ListAuditLogsHandler {
  constructor(
    protected readonly auditLogRepository: IAuditLogRepository,
  ) {}

  async execute(query: ListAuditLogsQuery): Promise<PaginatedResult<AuditLog>> {
    return this.auditLogRepository.findAll(query.pagination, {
      tableName: query.tableName,
      action: query.action,
      userId: query.userId,
      recordId: query.recordId,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
    });
  }
}
