import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetSaleQuery } from '../../../../../application/cqrs/sale/queries/get-sale/get-sale.query';
import { GetSaleHandler as ApplicationGetSaleHandler } from '../../../../../application/cqrs/sale/queries/get-sale/get-sale.handler';
import { SaleRepository } from '../../../../repositories/sale.repository';
import { SALE_REPOSITORY } from '../../../../common/injection-tokens';

@QueryHandler(GetSaleQuery)
export class GetSaleHandler implements IQueryHandler<GetSaleQuery> {
  private readonly appHandler: ApplicationGetSaleHandler;

  constructor(
    @Inject(SALE_REPOSITORY) saleRepository: SaleRepository,
  ) {
    this.appHandler = new ApplicationGetSaleHandler(saleRepository);
  }

  async execute(query: GetSaleQuery) {
    return this.appHandler.execute(query);
  }
}
