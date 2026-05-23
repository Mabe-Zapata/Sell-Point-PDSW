import { PaginationParams } from '../../../../../domain/repositories/pagination.types';

export class ListSalesQuery {
  constructor(
    public readonly pagination: PaginationParams = { page: 1, limit: 20 },
    public readonly q?: string,
    public readonly branchId?: string,
    public readonly customerId?: string,
    public readonly cashierUserId?: string,
    public readonly status?: string,
  ) {}
}