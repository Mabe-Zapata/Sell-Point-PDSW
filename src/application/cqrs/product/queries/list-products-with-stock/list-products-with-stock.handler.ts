import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ListProductsWithStockQuery } from './list-products-with-stock.query';
import { ListProductsWithStockValidator } from './list-products-with-stock.validator';
import { PRODUCT_QUERY_SERVICE } from '../../../../query-tokens';
import type { IProductQueryService } from '../../../../../domain/query-services/product.query-service.interface';

@QueryHandler(ListProductsWithStockQuery)
export class ListProductsWithStockHandler implements IQueryHandler<ListProductsWithStockQuery> {
  constructor(
    private readonly validator: ListProductsWithStockValidator,
    @Inject(PRODUCT_QUERY_SERVICE) private readonly productQueryService: IProductQueryService,
  ) {}

  async execute(query: ListProductsWithStockQuery) {
    const validPagination = this.validator.validate(query.pagination);
    return this.productQueryService.listProducts({
      page: validPagination.page,
      limit: validPagination.limit,
      q: query.q,
      categoryId: query.categoryId,
      isActive: query.isActive,
    });
  }
}