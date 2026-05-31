import { ListProductsWithStockQuery } from './list-products-with-stock.query';
import { PRODUCT_QUERY_SERVICE } from '../../../../query-tokens';
import type { IProductQueryService } from '../../../../../domain/query-services/product.query-service.interface';
export class ListProductsWithStockHandler {
  constructor(
    protected readonly productQueryService: IProductQueryService,
  ) {}

  async execute(query: ListProductsWithStockQuery) {
    return this.productQueryService.listProducts({
      page: query.pagination.page,
      limit: query.pagination.limit,
      q: query.q,
      categoryId: query.categoryId,
      isActive: query.isActive,
      createdFrom: query.createdFrom,
      createdTo: query.createdTo,
    });
  }
}
