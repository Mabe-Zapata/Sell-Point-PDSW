import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { ListInvoicesQuery } from './list-invoices.query';
import { ListInvoicesValidator } from './list-invoices.validator';
import { InvoiceRepository } from '../../../../../infrastructure/repositories/invoice.repository';
import { PaginatedResult } from '../../../../../domain/repositories/pagination.types';
import { Invoice } from '../../../../../domain/entities/invoice.entity';

@QueryHandler(ListInvoicesQuery)
export class ListInvoicesHandler implements IQueryHandler<ListInvoicesQuery> {
  constructor(
    private readonly validator: ListInvoicesValidator,
    private readonly invoiceRepository: InvoiceRepository,
  ) {}

  async execute(query: ListInvoicesQuery): Promise<PaginatedResult<Invoice>> {
    const validPagination = this.validator.validate(query.pagination);
    return this.invoiceRepository.findAll(validPagination, query.filters);
  }
}
