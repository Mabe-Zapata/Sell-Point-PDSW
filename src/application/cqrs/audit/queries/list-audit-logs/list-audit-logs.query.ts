import { PaginationParams } from '../../../../../domain/repositories/pagination.types';
import { AuditAction } from '../../../../../domain/entities/audit-log.entity';

export class ListAuditLogsQuery {
  constructor(
    public readonly pagination: PaginationParams = { page: 1, limit: 50 },
    public readonly tableName?: string,
    public readonly action?: AuditAction,
    public readonly userId?: string,
    public readonly recordId?: string,
    public readonly dateFrom?: Date,
    public readonly dateTo?: Date,
  ) {}
}
