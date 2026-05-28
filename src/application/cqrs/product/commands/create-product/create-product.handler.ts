import { randomUUID } from 'crypto';
import { CreateProductCommand } from './create-product.command';
import type { ICategoryRepository } from '../../../../../domain/repositories';
import type { IProductRepository } from '../../../../../domain/repositories';
import type { IStockMovementRepository } from '../../../../../domain/repositories';
import { Product } from '../../../../../domain/entities/product.entity';
import { StockMovement } from '../../../../../domain/entities/stock-movement.entity';
import { StockMovementType } from '../../../../../domain/entities/enums/stock-movement-type.enum';
import { EntityNotFoundException } from '../../../../../domain/exceptions/entity-not-found.exception';
import { BusinessRuleException } from '../../../../../domain/exceptions/business-rule.exception';

export class CreateProductHandler {
  constructor(
    protected readonly categoryRepository: ICategoryRepository,
    protected readonly productRepository: IProductRepository,
    protected readonly stockMovementRepository: IStockMovementRepository,
  ) {}

  async execute(command: CreateProductCommand): Promise<Product> {
    const category = await this.categoryRepository.findById(command.payload.categoryId);
    if (!category) {
      throw new EntityNotFoundException('Category', command.payload.categoryId);
    }

    if (command.payload.costPrice > command.payload.salePrice) {
      throw new BusinessRuleException('Cost price cannot be greater than sale price');
    }

    const code = await this.productRepository.getNextCode();

    const product = new Product({
      id: randomUUID(),
      categoryId: command.payload.categoryId,
      code,
      name: command.payload.name.trim(),
      description: command.payload.description?.trim() || undefined,
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
