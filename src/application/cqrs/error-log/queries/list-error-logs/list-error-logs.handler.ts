import { ListErrorLogsQuery } from './list-error-logs.query';
import { ERROR_LOG_REPOSITORY } from '../../../../tokens';
import type { IErrorLogRepository } from '../../../../../domain/repositories';
import { PaginatedResult } from '../../../../../domain/repositories/pagination.types';
import { ErrorLog } from '../../../../../domain/entities';export class ListErrorLogsHandler {
  constructor(
    protected readonly errorLogRepository: IErrorLogRepository,
  ) {}

  async execute(query: ListErrorLogsQuery): Promise<PaginatedResult<ErrorLog>> {
    return this.errorLogRepository.findAll(query.pagination, {
      q: query.q,
      exceptionType: query.exceptionType,
      userId: query.userId,
    });
  }
}
