import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ListInvoicesWithStockQuery } from './list-invoices-with-stock.query';
import { ListInvoicesWithStockValidator } from './list-invoices-with-stock.validator';
import { INVOICE_QUERY_SERVICE } from '../../../../query-tokens';
import type { IInvoiceQueryService } from '../../../../../domain/query-services/invoice.query-service.interface';

@QueryHandler(ListInvoicesWithStockQuery)
export class ListInvoicesWithStockHandler implements IQueryHandler<ListInvoicesWithStockQuery> {
  constructor(
    private readonly validator: ListInvoicesWithStockValidator,
    @Inject(INVOICE_QUERY_SERVICE) private readonly invoiceQueryService: IInvoiceQueryService,
  ) {}

  async execute(query: ListInvoicesWithStockQuery) {
    const validPagination = this.validator.validate(query.pagination);
    return this.invoiceQueryService.listInvoices({
      page: validPagination.page,
      limit: validPagination.limit,
      branchId: query.branchId,
      status: query.status,
      invoiceNumber: query.invoiceNumber,
      startDate: query.startDate,
      endDate: query.endDate,
    });
  }
}