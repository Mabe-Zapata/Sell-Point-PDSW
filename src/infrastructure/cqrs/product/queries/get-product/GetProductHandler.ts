import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetProductQuery } from '../../../../../application/cqrs/product/queries/get-product/get-product.query';
import { GetProductHandler as ApplicationGetProductHandler } from '../../../../../application/cqrs/product/queries/get-product/get-product.handler';
import { ProductRepository } from '../../../../repositories/product.repository';
import { PRODUCT_REPOSITORY } from '../../../../common/injection-tokens';

@QueryHandler(GetProductQuery)
export class GetProductHandler implements IQueryHandler<GetProductQuery> {
  private readonly appHandler: ApplicationGetProductHandler;

  constructor(
    @Inject(PRODUCT_REPOSITORY) productRepository: ProductRepository,
  ) {
    this.appHandler = new ApplicationGetProductHandler(productRepository);
  }

  async execute(query: GetProductQuery) {
    return this.appHandler.execute(query);
  }
}
