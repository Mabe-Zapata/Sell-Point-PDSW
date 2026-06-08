import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetInvoiceQuery } from '../../../../../application/cqrs/invoice/queries/get-invoice/get-invoice.query';
import { GetInvoiceHandler as ApplicationGetInvoiceHandler } from '../../../../../application/cqrs/invoice/queries/get-invoice/get-invoice.handler';
import { InvoiceQueryService } from '../../../../queries/invoice/invoice.query.service';
import { INVOICE_QUERY_SERVICE } from '../../../../../application/query-tokens';

@QueryHandler(GetInvoiceQuery)
export class GetInvoiceHandler implements IQueryHandler<GetInvoiceQuery> {
  private readonly appHandler: ApplicationGetInvoiceHandler;

  constructor(
    @Inject(INVOICE_QUERY_SERVICE) invoiceQueryService: InvoiceQueryService,
  ) {
    this.appHandler = new ApplicationGetInvoiceHandler(invoiceQueryService);
  }

  async execute(query: GetInvoiceQuery) {
    return this.appHandler.execute(query);
  }
}
