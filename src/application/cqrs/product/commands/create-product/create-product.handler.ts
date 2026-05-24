import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CreateProductCommand } from './create-product.command';
import { CreateProductValidator } from './create-product.validator';
import { PRODUCT_REPOSITORY, STOCK_MOVEMENT_REPOSITORY } from '../../../../tokens';
import type { IProductRepository } from '../../../../../domain/repositories';
import type { IStockMovementRepository } from '../../../../../domain/repositories';
import { Product } from '../../../../../domain/entities/product.entity';
import { StockMovement } from '../../../../../domain/entities/stock-movement.entity';
import { StockMovementType } from '../../../../../domain/entities/enums/stock-movement-type.enum';

@CommandHandler(CreateProductCommand)
export class CreateProductHandler implements ICommandHandler<CreateProductCommand> {
  constructor(
    private readonly validator: CreateProductValidator,
    @Inject(PRODUCT_REPOSITORY) private readonly productRepository: IProductRepository,
    @Inject(STOCK_MOVEMENT_REPOSITORY) private readonly stockMovementRepository: IStockMovementRepository,
  ) {}

  async execute(command: CreateProductCommand): Promise<Product> {
    await this.validator.validate(command.payload);

    const product = new Product({
      id: randomUUID(),
      categoryId: command.payload.categoryId,
      code: command.payload.code,
      name: command.payload.name,
      description: command.payload.description,
      salePrice: command.payload.salePrice,
      costPrice: command.payload.costPrice,
      currentStock: command.payload.initialStock ?? 0,
      isActive: true,
    });

    const created = await this.productRepository.create(product);

    if (command.payload.initialStock && command.payload.initialStock > 0) {
      await this.stockMovementRepository.create(
        new StockMovement({
          productId: created.id,
          type: StockMovementType.IN,
          quantity: command.payload.initialStock,
          previousStock: 0,
          newStock: command.payload.initialStock,
          description: 'Initial stock',
        }),
      );
    }

    return created;
  }
}
