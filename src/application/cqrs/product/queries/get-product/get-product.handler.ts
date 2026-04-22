import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { GetProductQuery } from './get-product.query';
import { GetProductValidator } from './get-product.validator';
import { Product } from '../../../../../domain/entities/product.entity';

@QueryHandler(GetProductQuery)
export class GetProductHandler implements IQueryHandler<GetProductQuery> {
  constructor(private readonly validator: GetProductValidator) {}

  async execute(query: GetProductQuery): Promise<Product> {
    return this.validator.validate(query.id);
  }
}
