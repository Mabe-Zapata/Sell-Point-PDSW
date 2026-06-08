import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetAuditLogQuery } from '../../../../../application/cqrs/audit/queries/get-audit-log/get-audit-log.query';
import { GetAuditLogHandler as AppGetAuditLogHandler } from '../../../../../application/cqrs/audit/queries/get-audit-log/get-audit-log.handler';
import { AuditLogRepository } from '../../../../repositories/audit-log.repository';
import { AUDIT_LOG_REPOSITORY } from '../../../../common/injection-tokens';

@QueryHandler(GetAuditLogQuery)
export class GetAuditLogHandler implements IQueryHandler<GetAuditLogQuery> {
  private readonly appHandler: AppGetAuditLogHandler;

  constructor(
    @Inject(AUDIT_LOG_REPOSITORY) auditLogRepository: AuditLogRepository,
  ) {
    this.appHandler = new AppGetAuditLogHandler(auditLogRepository);
  }

  async execute(query: GetAuditLogQuery) {
    return this.appHandler.execute(query);
  }
}
