import { PaginationParams } from '../../../../../domain/repositories/pagination.types';

export interface ListInvoicesFilters {
  branchId?: string;
  customerId?: string;
  status?: string;
  invoiceNumber?: string;
  startDate?: Date;
  endDate?: Date;
}

export class ListInvoicesQuery {
  constructor(
    public readonly pagination: PaginationParams,
    public readonly filters?: ListInvoicesFilters,
  ) {}
}
