import { ErrorLog } from '../entities';
import { PaginationParams, PaginatedResult } from './customer.repository.interface';

export interface ErrorLogFilters {
  q?: string;
  exceptionType?: string;
  userId?: string;
}

export interface IErrorLogRepository {
  findById(id: string): Promise<ErrorLog | null>;
  findAll(
    pagination?: PaginationParams,
    filters?: ErrorLogFilters,
  ): Promise<PaginatedResult<ErrorLog>>;
  create(errorLog: ErrorLog): Promise<ErrorLog>;
}