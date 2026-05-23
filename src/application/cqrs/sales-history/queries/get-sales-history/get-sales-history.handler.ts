import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetSalesHistoryQuery } from './get-sales-history.query';
import { GetSalesHistoryValidator } from './get-sales-history.validator';
import { SALES_HISTORY_REPOSITORY } from '../../../../tokens';
import type { ISalesHistoryRepository } from '../../../../../domain/repositories';
import { SalesHistory } from '../../../../../domain/entities';

@QueryHandler(GetSalesHistoryQuery)
export class GetSalesHistoryHandler implements IQueryHandler<GetSalesHistoryQuery> {
  constructor(
    private readonly validator: GetSalesHistoryValidator,
    @Inject(SALES_HISTORY_REPOSITORY) private readonly salesHistoryRepository: ISalesHistoryRepository,
  ) {}

  async execute(query: GetSalesHistoryQuery): Promise<SalesHistory | null> {
    this.validator.validate(query.saleId);
    return this.salesHistoryRepository.findBySaleId(query.saleId);
  }
}