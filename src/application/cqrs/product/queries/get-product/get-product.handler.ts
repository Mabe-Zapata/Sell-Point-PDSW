import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { GetProductQuery } from './get-product.query';
import { GetProductValidator } from './get-product.validator';
import { ProductRepository } from '../../../../../infrastructure/repositories/product.repository';
import { EntityNotFoundException } from '../../../../../domain/exceptions/entity-not-found.exception';
import { Product } from '../../../../../domain/entities/product.entity';

@QueryHandler(GetProductQuery)
export class GetProductHandler implements IQueryHandler<GetProductQuery> {
  constructor(
    private readonly validator: GetProductValidator,
    private readonly productRepository: ProductRepository,
  ) {}

  async execute(query: GetProductQuery): Promise<Product> {
    const id = this.validator.validate(query.id);
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new EntityNotFoundException('Product', id);
    }
    return product;
  }
}
