import { ListSalesQuery } from './list-sales.query';
import { SALE_REPOSITORY } from '../../../../tokens';
import type { ISaleRepository } from '../../../../../domain/repositories';
import { PaginatedResult } from '../../../../../domain/repositories/pagination.types';
import { Sale } from '../../../../../domain/entities';export class ListSalesHandler {
  constructor(
    protected readonly saleRepository: ISaleRepository,
  ) {}

  async execute(query: ListSalesQuery): Promise<PaginatedResult<Sale>> {
    return this.saleRepository.findAll(query.pagination, {
      q: query.q,
      branchId: query.branchId,
      customerId: query.customerId,
      cashierUserId: query.cashierUserId,
      status: query.status,
    });
  }
}
