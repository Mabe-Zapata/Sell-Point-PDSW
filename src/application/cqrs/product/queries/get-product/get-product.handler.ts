import { GetProductQuery } from './get-product.query';
import { PRODUCT_REPOSITORY } from '../../../../tokens';
import type { IProductRepository } from '../../../../../domain/repositories';
import { EntityNotFoundException } from '../../../../../domain/exceptions/entity-not-found.exception';
import { Product } from '../../../../../domain/entities/product.entity';
export class GetProductHandler {
  constructor(
    protected readonly productRepository: IProductRepository,
  ) {}

  async execute(query: GetProductQuery): Promise<Product> {
    const id = query.id;
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new EntityNotFoundException('Product', id);
    }
    return product;
  }
}
