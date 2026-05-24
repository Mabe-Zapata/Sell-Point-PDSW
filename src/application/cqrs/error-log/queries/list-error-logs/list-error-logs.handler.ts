import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ListErrorLogsQuery } from './list-error-logs.query';
import { ListErrorLogsValidator } from './list-error-logs.validator';
import { ERROR_LOG_REPOSITORY } from '../../../../tokens';
import type { IErrorLogRepository } from '../../../../../domain/repositories';
import { PaginatedResult } from '../../../../../domain/repositories/pagination.types';
import { ErrorLog } from '../../../../../domain/entities';

@QueryHandler(ListErrorLogsQuery)
export class ListErrorLogsHandler implements IQueryHandler<ListErrorLogsQuery> {
  constructor(
    private readonly validator: ListErrorLogsValidator,
    @Inject(ERROR_LOG_REPOSITORY) private readonly errorLogRepository: IErrorLogRepository,
  ) {}

  async execute(query: ListErrorLogsQuery): Promise<PaginatedResult<ErrorLog>> {
    const validPagination = this.validator.validate(query.pagination);
    return this.errorLogRepository.findAll(validPagination, {
      q: query.q,
      exceptionType: query.exceptionType,
      userId: query.userId,
    });
  }
}