import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetInvoiceQuery } from './get-invoice.query';
import { GetInvoiceValidator } from './get-invoice.validator';
import { INVOICE_REPOSITORY } from '../../../../tokens';
import type { IInvoiceRepository } from '../../../../../domain/repositories';
import { EntityNotFoundException } from '../../../../../domain/exceptions/entity-not-found.exception';
import { Invoice } from '../../../../../domain/entities/invoice.entity';

@QueryHandler(GetInvoiceQuery)
export class GetInvoiceHandler implements IQueryHandler<GetInvoiceQuery> {
  constructor(
    private readonly validator: GetInvoiceValidator,
    @Inject(INVOICE_REPOSITORY) private readonly invoiceRepository: IInvoiceRepository,
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
