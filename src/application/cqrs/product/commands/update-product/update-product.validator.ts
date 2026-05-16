import { Injectable } from '@nestjs/common';
import { ProductRepository } from '../../../../../infrastructure/repositories/product.repository';
import { EntityNotFoundException } from '../../../../../domain/exceptions/entity-not-found.exception';
import { Product } from '../../../../../domain/entities/product.entity';

@Injectable()
export class UpdateProductValidator {
  constructor(private readonly productRepository: ProductRepository) {}

  async validate(id: string): Promise<Product> {
    const existingProduct = await this.productRepository.findById(id);
    if (!existingProduct) {
      throw new EntityNotFoundException('Product', id);
    }
    return existingProduct;
  }
}
