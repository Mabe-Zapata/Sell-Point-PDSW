import { GetInvoiceQuery } from './get-invoice.query';
import type { IInvoiceQueryService, InvoiceListItem } from '../../../../../domain/query-services/invoice.query-service.interface';
import { EntityNotFoundException } from '../../../../../domain/exceptions/entity-not-found.exception';

export class GetInvoiceHandler {
  constructor(
    private readonly invoiceQueryService: IInvoiceQueryService,
  ) {}

  async execute(query: GetInvoiceQuery): Promise<InvoiceListItem> {
    const invoice = await this.invoiceQueryService.getInvoiceById(query.id);
    if (!invoice) {
      throw new EntityNotFoundException('Invoice', query.id);
    }
    return invoice;
  }
}
