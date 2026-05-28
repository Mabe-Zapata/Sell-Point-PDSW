import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetNextProductCodeQuery } from '../../../../../application/cqrs/product/queries/get-next-product-code/get-next-product-code.query';
import { GetNextProductCodeHandler as ApplicationGetNextProductCodeHandler } from '../../../../../application/cqrs/product/queries/get-next-product-code/get-next-product-code.handler';
import { ProductRepository } from '../../../../repositories/product.repository';
import { PRODUCT_REPOSITORY } from '../../../../common/injection-tokens';

@QueryHandler(GetNextProductCodeQuery)
export class GetNextProductCodeHandler implements IQueryHandler<GetNextProductCodeQuery> {
  private readonly appHandler: ApplicationGetNextProductCodeHandler;

  constructor(
    @Inject(PRODUCT_REPOSITORY) productRepository: ProductRepository,
  ) {
    this.appHandler = new ApplicationGetNextProductCodeHandler(productRepository);
  }

  async execute(query: GetNextProductCodeQuery) {
    return this.appHandler.execute(query);
  }
}
