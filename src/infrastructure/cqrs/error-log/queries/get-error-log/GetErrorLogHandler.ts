import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetErrorLogQuery } from '../../../../../application/cqrs/error-log/queries/get-error-log/get-error-log.query';
import { GetErrorLogHandler as ApplicationGetErrorLogHandler } from '../../../../../application/cqrs/error-log/queries/get-error-log/get-error-log.handler';
import { ErrorLogRepository } from '../../../../repositories/error-log.repository';
import { ERROR_LOG_REPOSITORY } from '../../../../common/injection-tokens';

@QueryHandler(GetErrorLogQuery)
export class GetErrorLogHandler implements IQueryHandler<GetErrorLogQuery> {
  private readonly appHandler: ApplicationGetErrorLogHandler;

  constructor(
    @Inject(ERROR_LOG_REPOSITORY) errorLogRepository: ErrorLogRepository,
  ) {
    this.appHandler = new ApplicationGetErrorLogHandler(errorLogRepository);
  }

  async execute(query: GetErrorLogQuery) {
    return this.appHandler.execute(query);
  }
}
