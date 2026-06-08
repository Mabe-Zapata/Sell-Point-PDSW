import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetAuditSummaryQuery } from '../../../../../application/cqrs/audit/queries/get-audit-summary/get-audit-summary.query';
import { GetAuditSummaryHandler as AppGetAuditSummaryHandler } from '../../../../../application/cqrs/audit/queries/get-audit-summary/get-audit-summary.handler';
import { AuditLogRepository } from '../../../../repositories/audit-log.repository';
import { AUDIT_LOG_REPOSITORY } from '../../../../common/injection-tokens';

@QueryHandler(GetAuditSummaryQuery)
export class GetAuditSummaryHandler implements IQueryHandler<GetAuditSummaryQuery> {
  private readonly appHandler: AppGetAuditSummaryHandler;

  constructor(
    @Inject(AUDIT_LOG_REPOSITORY) auditLogRepository: AuditLogRepository,
  ) {
    this.appHandler = new AppGetAuditSummaryHandler(auditLogRepository);
  }

  async execute(query: GetAuditSummaryQuery) {
    return this.appHandler.execute(query);
  }
}
