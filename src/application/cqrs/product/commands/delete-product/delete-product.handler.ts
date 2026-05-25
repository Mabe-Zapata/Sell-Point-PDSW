import { DeleteProductCommand } from './delete-product.command';
import type { IProductRepository, IStockMovementRepository } from '../../../../../domain/repositories';
import { EntityNotFoundException } from '../../../../../domain/exceptions/entity-not-found.exception';
import { BusinessRuleException } from '../../../../../domain/exceptions/business-rule.exception';

export class DeleteProductHandler {
  constructor(
    protected readonly productRepository: IProductRepository,
    protected readonly stockMovementRepository: IStockMovementRepository,
  ) {}

  async execute(command: DeleteProductCommand): Promise<void> {
    const id = command.id;
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new EntityNotFoundException('Product', id);
    }

    // R12: Product soft delete without history check
    const movements = await this.stockMovementRepository.findAll(
      { page: 1, limit: 1 },
      { productId: id }
    );

    if (movements.total > 0) {
      // Product has history - soft delete only
      throw new BusinessRuleException('Cannot physically delete product with stock movement history. Use soft delete instead.');
    }

    // No history, allow physical delete
    await this.productRepository.softDelete(id);
  }
}
