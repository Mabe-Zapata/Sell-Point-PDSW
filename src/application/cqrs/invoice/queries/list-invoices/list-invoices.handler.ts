import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ListInvoicesQuery } from './list-invoices.query';
import { ListInvoicesValidator } from './list-invoices.validator';
import { INVOICE_REPOSITORY } from '../../../../tokens';
import type { IInvoiceRepository } from '../../../../../domain/repositories';
import { PaginatedResult } from '../../../../../domain/repositories/pagination.types';
import { Invoice } from '../../../../../domain/entities/invoice.entity';

@QueryHandler(ListInvoicesQuery)
export class ListInvoicesHandler implements IQueryHandler<ListInvoicesQuery> {
  constructor(
    private readonly validator: ListInvoicesValidator,
    @Inject(INVOICE_REPOSITORY) private readonly invoiceRepository: IInvoiceRepository,
  ) {}

  async execute(query: ListInvoicesQuery): Promise<PaginatedResult<Invoice>> {
    const validPagination = this.validator.validate(query.pagination);
    return this.invoiceRepository.findAll(validPagination, query.filters);
  }
}
