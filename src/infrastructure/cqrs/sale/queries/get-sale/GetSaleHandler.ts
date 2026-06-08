import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetSaleQuery } from '../../../../../application/cqrs/sale/queries/get-sale/get-sale.query';
import { GetSaleHandler as ApplicationGetSaleHandler } from '../../../../../application/cqrs/sale/queries/get-sale/get-sale.handler';
import { SaleRepository } from '../../../../repositories/sale.repository';
import { SaleDetailRepository } from '../../../../repositories/sale-detail.repository';
import type { ISaleRepository, ISaleDetailRepository } from '../../../../../domain/repositories';
import { SALE_REPOSITORY, SALE_DETAIL_REPOSITORY } from '../../../../common/injection-tokens';

@QueryHandler(GetSaleQuery)
export class GetSaleHandler implements IQueryHandler<GetSaleQuery> {
  private readonly appHandler: ApplicationGetSaleHandler;

  constructor(
    @Inject(SALE_REPOSITORY) saleRepository: SaleRepository,
    @Inject(SALE_DETAIL_REPOSITORY) saleDetailRepository: SaleDetailRepository,
  ) {
    this.appHandler = new ApplicationGetSaleHandler(
      saleRepository,
      saleDetailRepository as unknown as ISaleDetailRepository,
    );
  }

  async execute(query: GetSaleQuery) {
    return this.appHandler.execute(query);
  }
}