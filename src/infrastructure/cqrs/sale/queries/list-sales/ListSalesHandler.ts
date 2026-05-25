import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ListSalesQuery } from '../../../../../application/cqrs/sale/queries/list-sales/list-sales.query';
import { ListSalesHandler as ApplicationListSalesHandler } from '../../../../../application/cqrs/sale/queries/list-sales/list-sales.handler';
import { SaleRepository } from '../../../../repositories/sale.repository';
import { SALE_REPOSITORY } from '../../../../common/injection-tokens';

@QueryHandler(ListSalesQuery)
export class ListSalesHandler implements IQueryHandler<ListSalesQuery> {
  private readonly appHandler: ApplicationListSalesHandler;

  constructor(
    @Inject(SALE_REPOSITORY) saleRepository: SaleRepository,
  ) {
    this.appHandler = new ApplicationListSalesHandler(saleRepository);
  }

  async execute(query: ListSalesQuery) {
    return this.appHandler.execute(query);
  }
}
