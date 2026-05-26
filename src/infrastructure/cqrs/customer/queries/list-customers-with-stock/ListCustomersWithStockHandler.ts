import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ListCustomersWithStockQuery } from '../../../../../application/cqrs/customer/queries/list-customers-with-stock/list-customers-with-stock.query';
import { ListCustomersWithStockHandler as ApplicationListCustomersWithStockHandler } from '../../../../../application/cqrs/customer/queries/list-customers-with-stock/list-customers-with-stock.handler';
import { CustomerQueryService } from '../../../../queries/customer/customer.query.service';
import { CUSTOMER_QUERY_SERVICE } from '../../../../../application/query-tokens';

@QueryHandler(ListCustomersWithStockQuery)
export class ListCustomersWithStockHandler implements IQueryHandler<ListCustomersWithStockQuery> {
  private readonly appHandler: ApplicationListCustomersWithStockHandler;

  constructor(
    @Inject(CUSTOMER_QUERY_SERVICE) customerQueryService: CustomerQueryService,
  ) {
    this.appHandler = new ApplicationListCustomersWithStockHandler(customerQueryService);
  }

  async execute(query: ListCustomersWithStockQuery) {
    return this.appHandler.execute(query);
  }
}
