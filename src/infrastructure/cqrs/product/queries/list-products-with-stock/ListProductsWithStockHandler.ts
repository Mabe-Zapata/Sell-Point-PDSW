import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ListProductsWithStockQuery } from '../../../../../application/cqrs/product/queries/list-products-with-stock/list-products-with-stock.query';
import { ListProductsWithStockHandler as ApplicationListProductsWithStockHandler } from '../../../../../application/cqrs/product/queries/list-products-with-stock/list-products-with-stock.handler';
import { PRODUCT_QUERY_SERVICE } from '../../../../../application/query-tokens';

@QueryHandler(ListProductsWithStockQuery)
export class ListProductsWithStockHandler implements IQueryHandler<ListProductsWithStockQuery> {
  private readonly appHandler: ApplicationListProductsWithStockHandler;

  constructor(
    @Inject(PRODUCT_QUERY_SERVICE) productQueryService: any,
  ) {
    this.appHandler = new ApplicationListProductsWithStockHandler(productQueryService);
  }

  async execute(query: ListProductsWithStockQuery) {
    return this.appHandler.execute(query);
  }
}