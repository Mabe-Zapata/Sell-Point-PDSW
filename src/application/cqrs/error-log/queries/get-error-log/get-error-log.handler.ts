import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetErrorLogQuery } from './get-error-log.query';
import { GetErrorLogValidator } from './get-error-log.validator';
import { ERROR_LOG_REPOSITORY } from '../../../../tokens';
import type { IErrorLogRepository } from '../../../../../domain/repositories';
import { ErrorLog } from '../../../../../domain/entities';

@QueryHandler(GetErrorLogQuery)
export class GetErrorLogHandler implements IQueryHandler<GetErrorLogQuery> {
  constructor(
    private readonly validator: GetErrorLogValidator,
    @Inject(ERROR_LOG_REPOSITORY) private readonly errorLogRepository: IErrorLogRepository,
  ) {}

  async execute(query: GetErrorLogQuery): Promise<ErrorLog | null> {
    this.validator.validate(query.id);
    return this.errorLogRepository.findById(query.id);
  }
}