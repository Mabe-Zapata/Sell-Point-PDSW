import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetMovementsHistoryQuery } from '../../../../../application/cqrs/inventory/queries/get-movements-history/get-movements-history.query';
import { GetMovementsHistoryHandler as ApplicationGetMovementsHistoryHandler } from '../../../../../application/cqrs/inventory/queries/get-movements-history/get-movements-history.handler';
import { StockMovementRepository } from '../../../../repositories/stock-movement.repository';
import { STOCK_MOVEMENT_REPOSITORY } from '../../../../common/injection-tokens';

@QueryHandler(GetMovementsHistoryQuery)
export class GetMovementsHistoryHandler implements IQueryHandler<GetMovementsHistoryQuery> {
  private readonly appHandler: ApplicationGetMovementsHistoryHandler;

  constructor(
    @Inject(STOCK_MOVEMENT_REPOSITORY) stockMovementRepository: StockMovementRepository,
  ) {
    this.appHandler = new ApplicationGetMovementsHistoryHandler(stockMovementRepository);
  }

  async execute(query: GetMovementsHistoryQuery) {
    return this.appHandler.execute(query);
  }
}
