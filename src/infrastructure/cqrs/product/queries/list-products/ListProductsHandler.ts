import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ListProductsQuery } from '../../../../../application/cqrs/product/queries/list-products/list-products.query';
import { ListProductsHandler as ApplicationListProductsHandler } from '../../../../../application/cqrs/product/queries/list-products/list-products.handler';
import { ProductRepository } from '../../../../repositories/product.repository';
import { PRODUCT_REPOSITORY } from '../../../../common/injection-tokens';

@QueryHandler(ListProductsQuery)
export class ListProductsHandler implements IQueryHandler<ListProductsQuery> {
  private readonly appHandler: ApplicationListProductsHandler;

  constructor(
    @Inject(PRODUCT_REPOSITORY) productRepository: ProductRepository,
  ) {
    this.appHandler = new ApplicationListProductsHandler(productRepository);
  }

  async execute(query: ListProductsQuery) {
    return this.appHandler.execute(query);
  }
}
