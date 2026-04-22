import {
  InvoiceFilters,
  PaginatedResult,
} from '../../../../../domain/repositories/invoice.repository.interface';
import { PaginationParams } from '../../../../../domain/repositories/customer.repository.interface';

export class ListInvoicesQuery {
  constructor(
    public readonly pagination: PaginationParams = { page: 1, limit: 20 },
    public readonly filters: InvoiceFilters = {},
  ) {}
}
