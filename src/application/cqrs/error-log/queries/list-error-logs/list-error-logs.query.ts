import { PaginationParams } from '../../../../../domain/repositories/pagination.types';

export class ListErrorLogsQuery {
  constructor(
    public readonly pagination: PaginationParams = { page: 1, limit: 20 },
    public readonly q?: string,
    public readonly exceptionType?: string,
    public readonly userId?: string,
  ) {}
}