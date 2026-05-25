import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { CreateProductCommand } from '../../../../../application/cqrs/product/commands/create-product/create-product.command';
import { CreateProductHandler as ApplicationCreateProductHandler } from '../../../../../application/cqrs/product/commands/create-product/create-product.handler';
import { CategoryRepository } from '../../../../repositories/category.repository';
import { ProductRepository } from '../../../../repositories/product.repository';
import { StockMovementRepository } from '../../../../repositories/stock-movement.repository';
import { CATEGORY_REPOSITORY, PRODUCT_REPOSITORY, STOCK_MOVEMENT_REPOSITORY } from '../../../../common/injection-tokens';

@CommandHandler(CreateProductCommand)
export class CreateProductHandler implements ICommandHandler<CreateProductCommand> {
  private readonly appHandler: ApplicationCreateProductHandler;

  constructor(
    @Inject(CATEGORY_REPOSITORY) categoryRepository: CategoryRepository,
    @Inject(PRODUCT_REPOSITORY) productRepository: ProductRepository,
    @Inject(STOCK_MOVEMENT_REPOSITORY) stockMovementRepository: StockMovementRepository,
  ) {
    this.appHandler = new ApplicationCreateProductHandler(categoryRepository, productRepository, stockMovementRepository);
  }

  async execute(command: CreateProductCommand) {
    return this.appHandler.execute(command);
  }
}
