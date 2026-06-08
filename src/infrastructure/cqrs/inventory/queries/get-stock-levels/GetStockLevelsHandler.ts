import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetStockLevelsQuery } from '../../../../../application/cqrs/inventory/queries/get-stock-levels/get-stock-levels.query';
import { GetStockLevelsHandler as ApplicationGetStockLevelsHandler } from '../../../../../application/cqrs/inventory/queries/get-stock-levels/get-stock-levels.handler';
import { ProductRepository } from '../../../../repositories/product.repository';
import { PRODUCT_REPOSITORY } from '../../../../common/injection-tokens';

@QueryHandler(GetStockLevelsQuery)
export class GetStockLevelsHandler implements IQueryHandler<GetStockLevelsQuery> {
  private readonly appHandler: ApplicationGetStockLevelsHandler;

  constructor(
    @Inject(PRODUCT_REPOSITORY) productRepository: ProductRepository,
  ) {
    this.appHandler = new ApplicationGetStockLevelsHandler(productRepository);
  }

  async execute(query: GetStockLevelsQuery): Promise<any> {
    return this.appHandler.execute(query);
  }
}
