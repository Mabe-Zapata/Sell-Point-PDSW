import { Injectable } from '@nestjs/common';
import { ProductRepository } from '../../../../../infrastructure/repositories/product.repository';
import { EntityNotFoundException } from '../../../../../domain/exceptions/entity-not-found.exception';

@Injectable()
export class DeleteProductValidator {
  constructor(private readonly productRepository: ProductRepository) {}

  async validate(id: string): Promise<void> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new EntityNotFoundException('Product', id);
    }
  }
}
