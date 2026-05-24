import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ListProductsQuery } from './list-products.query';
import { ListProductsValidator } from './list-products.validator';
import { PRODUCT_REPOSITORY } from '../../../../tokens';
import type { IProductRepository } from '../../../../../domain/repositories';
import { PaginatedResult } from '../../../../../domain/repositories/pagination.types';
import { Product } from '../../../../../domain/entities/product.entity';

@QueryHandler(ListProductsQuery)
export class ListProductsHandler implements IQueryHandler<ListProductsQuery> {
  constructor(
    private readonly validator: ListProductsValidator,
    @Inject(PRODUCT_REPOSITORY) private readonly productRepository: IProductRepository,
  ) {}

  async execute(query: ListProductsQuery): Promise<PaginatedResult<Product>> {
    const validPagination = this.validator.validate(query.pagination);
    return this.productRepository.findAll(validPagination, query.filters);
  }
}
