import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { AdjustStockCommand } from '../../../../../application/cqrs/inventory/commands/adjust-stock/adjust-stock.command';
import { AdjustStockHandler as ApplicationAdjustStockHandler } from '../../../../../application/cqrs/inventory/commands/adjust-stock/adjust-stock.handler';
import { ProductRepository } from '../../../../repositories/product.repository';
import { StockMovementRepository } from '../../../../repositories/stock-movement.repository';
import { PRODUCT_REPOSITORY, STOCK_MOVEMENT_REPOSITORY } from '../../../../common/injection-tokens';

@CommandHandler(AdjustStockCommand)
export class AdjustStockHandler implements ICommandHandler<AdjustStockCommand> {
  private readonly appHandler: ApplicationAdjustStockHandler;

  constructor(
    @Inject(PRODUCT_REPOSITORY) productRepository: ProductRepository,
    @Inject(STOCK_MOVEMENT_REPOSITORY) stockMovementRepository: StockMovementRepository,
  ) {
    this.appHandler = new ApplicationAdjustStockHandler(productRepository, stockMovementRepository);
  }

  async execute(command: AdjustStockCommand) {
    return this.appHandler.execute(command);
  }
}
