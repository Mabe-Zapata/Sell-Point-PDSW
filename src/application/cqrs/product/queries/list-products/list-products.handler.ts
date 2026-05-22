import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { ListProductsQuery } from './list-products.query';
import { ListProductsValidator } from './list-products.validator';
import { ProductRepository } from '../../../../../infrastructure/repositories/product.repository';
import { ProductFilters } from '../../../../../domain/repositories/product.repository.interface';
import { PaginatedResult } from '../../../../../domain/repositories/pagination.types';
import { Product } from '../../../../../domain/entities/product.entity';

@QueryHandler(ListProductsQuery)
export class ListProductsHandler implements IQueryHandler<ListProductsQuery> {
  constructor(
    private readonly validator: ListProductsValidator,
    private readonly productRepository: ProductRepository,
  ) {}

  async execute(query: ListProductsQuery): Promise<PaginatedResult<Product>> {
    const validPagination = this.validator.validate(query.pagination);
    return this.productRepository.findAll(validPagination, query.filters);
  }
}
