import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ListAuditLogsQuery } from '../../../../../application/cqrs/audit/queries/list-audit-logs/list-audit-logs.query';
import { ListAuditLogsHandler as AppListAuditLogsHandler } from '../../../../../application/cqrs/audit/queries/list-audit-logs/list-audit-logs.handler';
import { AuditLogRepository } from '../../../../repositories/audit-log.repository';
import { AUDIT_LOG_REPOSITORY } from '../../../../common/injection-tokens';

@QueryHandler(ListAuditLogsQuery)
export class ListAuditLogsHandler implements IQueryHandler<ListAuditLogsQuery> {
  private readonly appHandler: AppListAuditLogsHandler;

  constructor(
    @Inject(AUDIT_LOG_REPOSITORY) auditLogRepository: AuditLogRepository,
  ) {
    this.appHandler = new AppListAuditLogsHandler(auditLogRepository);
  }

  async execute(query: ListAuditLogsQuery) {
    return this.appHandler.execute(query);
  }
}
