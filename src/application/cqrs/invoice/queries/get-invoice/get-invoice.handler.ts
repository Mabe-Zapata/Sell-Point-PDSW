import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { GetInvoiceQuery } from './get-invoice.query';
import { GetInvoiceValidator } from './get-invoice.validator';
import { Invoice } from '../../../../../domain/entities/invoice.entity';

@QueryHandler(GetInvoiceQuery)
export class GetInvoiceHandler implements IQueryHandler<GetInvoiceQuery> {
  constructor(private readonly validator: GetInvoiceValidator) {}

  async execute(query: GetInvoiceQuery): Promise<Invoice> {
    return this.validator.validate(query.id);
  }
}
