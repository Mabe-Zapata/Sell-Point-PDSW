import { DeactivateProductCommand } from './deactivate-product.command';
import type { IProductRepository } from '../../../../../domain/repositories';
import { EntityNotFoundException } from '../../../../../domain/exceptions/entity-not-found.exception';
import { Product } from '../../../../../domain/entities/product.entity';

export class DeactivateProductHandler {
  constructor(
    protected readonly productRepository: IProductRepository,
  ) {}

  async execute(command: DeactivateProductCommand): Promise<Product> {
    const product = await this.productRepository.findById(command.id);
    if (!product) {
      throw new EntityNotFoundException('Product', command.id);
    }

    product.deactivate();

    return this.productRepository.update(product);
  }
}
