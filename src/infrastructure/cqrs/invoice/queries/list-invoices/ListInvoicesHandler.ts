import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ListInvoicesQuery } from '../../../../../application/cqrs/invoice/queries/list-invoices/list-invoices.query';
import { ListInvoicesHandler as ApplicationListInvoicesHandler } from '../../../../../application/cqrs/invoice/queries/list-invoices/list-invoices.handler';
import { InvoiceQueryService } from '../../../../queries/invoice/invoice.query.service';
import { INVOICE_QUERY_SERVICE } from '../../../../../application/query-tokens';

@QueryHandler(ListInvoicesQuery)
export class ListInvoicesHandler implements IQueryHandler<ListInvoicesQuery> {
  private readonly appHandler: ApplicationListInvoicesHandler;

  constructor(
    @Inject(INVOICE_QUERY_SERVICE) invoiceQueryService: InvoiceQueryService,
  ) {
    this.appHandler = new ApplicationListInvoicesHandler(invoiceQueryService);
  }

  async execute(query: ListInvoicesQuery) {
    return this.appHandler.execute(query);
  }
}
