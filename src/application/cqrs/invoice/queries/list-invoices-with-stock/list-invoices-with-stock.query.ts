import { PaginationParams } from '../../../../../domain/repositories/pagination.types';

export class ListInvoicesWithStockQuery {
  constructor(
    public readonly pagination: PaginationParams = { page: 1, limit: 20 },
    public readonly branchId?: string,
    public readonly status?: string,
    public readonly invoiceNumber?: string,
    public readonly startDate?: Date,
    public readonly endDate?: Date,
  ) {}
}