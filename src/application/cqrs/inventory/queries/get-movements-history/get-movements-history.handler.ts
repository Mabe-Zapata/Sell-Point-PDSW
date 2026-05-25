import { GetMovementsHistoryQuery } from './get-movements-history.query';
import { STOCK_MOVEMENT_REPOSITORY } from '../../../../tokens';
import type { IStockMovementRepository } from '../../../../../domain/repositories';
import { PaginatedResult } from '../../../../../domain/repositories/pagination.types';
import { StockMovement } from '../../../../../domain/entities';export class GetMovementsHistoryHandler {
  constructor(
    protected readonly stockMovementRepository: IStockMovementRepository,
  ) {}

  async execute(query: GetMovementsHistoryQuery): Promise<PaginatedResult<StockMovement>> {
    return this.stockMovementRepository.findAll(query.pagination, {
      productId: query.productId,
      type: query.type,
      userId: query.userId,
      referenceType: query.referenceType,
      referenceId: query.referenceId,
    });
  }
}
