import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { DeleteProductCommand } from '../../../../../application/cqrs/product/commands/delete-product/delete-product.command';
import { DeleteProductHandler as ApplicationDeleteProductHandler } from '../../../../../application/cqrs/product/commands/delete-product/delete-product.handler';
import { ProductRepository } from '../../../../repositories/product.repository';
import { StockMovementRepository } from '../../../../repositories/stock-movement.repository';
import { PRODUCT_REPOSITORY, STOCK_MOVEMENT_REPOSITORY } from '../../../../common/injection-tokens';

@CommandHandler(DeleteProductCommand)
export class DeleteProductHandler implements ICommandHandler<DeleteProductCommand> {
  private readonly appHandler: ApplicationDeleteProductHandler;

  constructor(
    @Inject(PRODUCT_REPOSITORY) productRepository: ProductRepository,
    @Inject(STOCK_MOVEMENT_REPOSITORY) stockMovementRepository: StockMovementRepository,
  ) {
    this.appHandler = new ApplicationDeleteProductHandler(productRepository, stockMovementRepository);
  }

  async execute(command: DeleteProductCommand) {
    return this.appHandler.execute(command);
  }
}
