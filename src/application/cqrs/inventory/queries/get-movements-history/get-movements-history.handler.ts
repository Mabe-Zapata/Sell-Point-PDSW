import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetMovementsHistoryQuery } from './get-movements-history.query';
import { GetMovementsHistoryValidator } from './get-movements-history.validator';
import { STOCK_MOVEMENT_REPOSITORY } from '../../../../tokens';
import type { IStockMovementRepository } from '../../../../../domain/repositories';
import { PaginatedResult } from '../../../../../domain/repositories/pagination.types';
import { StockMovement } from '../../../../../domain/entities';

@QueryHandler(GetMovementsHistoryQuery)
export class GetMovementsHistoryHandler implements IQueryHandler<GetMovementsHistoryQuery> {
  constructor(
    private readonly validator: GetMovementsHistoryValidator,
    @Inject(STOCK_MOVEMENT_REPOSITORY) private readonly stockMovementRepository: IStockMovementRepository,
  ) {}

  async execute(query: GetMovementsHistoryQuery): Promise<PaginatedResult<StockMovement>> {
    const validPagination = this.validator.validate(query.pagination);
    return this.stockMovementRepository.findAll(validPagination, {
      warehouseId: query.warehouseId,
      productId: query.productId,
      type: query.type,
      userId: query.userId,
      referenceType: query.referenceType,
      referenceId: query.referenceId,
    });
  }
}