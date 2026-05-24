import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ListSalesQuery } from './list-sales.query';
import { ListSalesValidator } from './list-sales.validator';
import { SALE_REPOSITORY } from '../../../../tokens';
import type { ISaleRepository } from '../../../../../domain/repositories';
import { PaginatedResult } from '../../../../../domain/repositories/pagination.types';
import { Sale } from '../../../../../domain/entities';

@QueryHandler(ListSalesQuery)
export class ListSalesHandler implements IQueryHandler<ListSalesQuery> {
  constructor(
    private readonly validator: ListSalesValidator,
    @Inject(SALE_REPOSITORY) private readonly saleRepository: ISaleRepository,
  ) {}

  async execute(query: ListSalesQuery): Promise<PaginatedResult<Sale>> {
    const validPagination = this.validator.validate(query.pagination);
    return this.saleRepository.findAll(validPagination, {
      q: query.q,
      branchId: query.branchId,
      customerId: query.customerId,
      cashierUserId: query.cashierUserId,
      status: query.status,
    });
  }
}