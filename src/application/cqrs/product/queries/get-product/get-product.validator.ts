import { Injectable } from '@nestjs/common';
import { ProductRepository } from '../../../../../infrastructure/repositories/product.repository';
import { EntityNotFoundException } from '../../../../../domain/exceptions/entity-not-found.exception';
import { Product } from '../../../../../domain/entities/product.entity';

@Injectable()
export class GetProductValidator {
  constructor(private readonly productRepository: ProductRepository) {}

  async validate(id: string): Promise<Product> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new EntityNotFoundException('Product', id);
    }
    return product;
  }
}
