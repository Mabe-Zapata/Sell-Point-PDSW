import { ListProductsQuery } from './list-products.query';
import { PRODUCT_REPOSITORY } from '../../../../tokens';
import type { IProductRepository } from '../../../../../domain/repositories';
import { PaginatedResult } from '../../../../../domain/repositories/pagination.types';
import { Product } from '../../../../../domain/entities/product.entity';export class ListProductsHandler {
  constructor(
    protected readonly productRepository: IProductRepository,
  ) {}

  async execute(query: ListProductsQuery): Promise<PaginatedResult<Product>> {
    return this.productRepository.findAll(query.pagination, query.filters);
  }
}
