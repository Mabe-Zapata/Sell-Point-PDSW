import { ListInvoicesQuery } from './list-invoices.query';
import type { IInvoiceQueryService, InvoiceListItem } from '../../../../../domain/query-services/invoice.query-service.interface';
import type { PaginatedResult } from '../../../../../domain/repositories/pagination.types';

export class ListInvoicesHandler {
  constructor(
    private readonly invoiceQueryService: IInvoiceQueryService,
  ) {}

  async execute(query: ListInvoicesQuery): Promise<PaginatedResult<InvoiceListItem>> {
    return this.invoiceQueryService.listInvoices({
      page: query.pagination.page,
      limit: query.pagination.limit,
      ...query.filters,
    });
  }
}
