import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { GetInvoiceQuery } from './get-invoice.query';
import { GetInvoiceValidator } from './get-invoice.validator';
import { InvoiceRepository } from '../../../../../infrastructure/repositories/invoice.repository';
import { EntityNotFoundException } from '../../../../../domain/exceptions/entity-not-found.exception';
import { Invoice } from '../../../../../domain/entities/invoice.entity';

@QueryHandler(GetInvoiceQuery)
export class GetInvoiceHandler implements IQueryHandler<GetInvoiceQuery> {
  constructor(
    private readonly validator: GetInvoiceValidator,
    private readonly invoiceRepository: InvoiceRepository,
  ) {}

  async execute(query: GetInvoiceQuery): Promise<Invoice> {
    const id = this.validator.validate(query.id);
    const invoice = await this.invoiceRepository.findById(id);
    if (!invoice) {
      throw new EntityNotFoundException('Invoice', id);
    }
    return invoice;
  }
}
