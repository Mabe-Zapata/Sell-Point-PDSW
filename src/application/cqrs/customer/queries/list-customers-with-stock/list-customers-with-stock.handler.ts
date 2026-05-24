import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ListCustomersWithStockQuery } from './list-customers-with-stock.query';
import { ListCustomersWithStockValidator } from './list-customers-with-stock.validator';
import { CUSTOMER_QUERY_SERVICE } from '../../../../query-tokens';
import type { ICustomerQueryService } from '../../../../../domain/query-services/customer.query-service.interface';

@QueryHandler(ListCustomersWithStockQuery)
export class ListCustomersWithStockHandler implements IQueryHandler<ListCustomersWithStockQuery> {
  constructor(
    private readonly validator: ListCustomersWithStockValidator,
    @Inject(CUSTOMER_QUERY_SERVICE) private readonly customerQueryService: ICustomerQueryService,
  ) {}

  async execute(query: ListCustomersWithStockQuery) {
    const validPagination = this.validator.validate(query.pagination);
    return this.customerQueryService.listCustomers({
      page: validPagination.page,
      limit: validPagination.limit,
      q: query.q,
      // identificationType replaced by cedula (simplify-schema-uta SDD)
      cedula: query.cedula,
    });
  }
}