import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ListErrorLogsQuery } from '../../../../../application/cqrs/error-log/queries/list-error-logs/list-error-logs.query';
import { ListErrorLogsHandler as ApplicationListErrorLogsHandler } from '../../../../../application/cqrs/error-log/queries/list-error-logs/list-error-logs.handler';
import { ErrorLogRepository } from '../../../../repositories/error-log.repository';
import { ERROR_LOG_REPOSITORY } from '../../../../common/injection-tokens';

@QueryHandler(ListErrorLogsQuery)
export class ListErrorLogsHandler implements IQueryHandler<ListErrorLogsQuery> {
  private readonly appHandler: ApplicationListErrorLogsHandler;

  constructor(
    @Inject(ERROR_LOG_REPOSITORY) errorLogRepository: ErrorLogRepository,
  ) {
    this.appHandler = new ApplicationListErrorLogsHandler(errorLogRepository);
  }

  async execute(query: ListErrorLogsQuery) {
    return this.appHandler.execute(query);
  }
}
