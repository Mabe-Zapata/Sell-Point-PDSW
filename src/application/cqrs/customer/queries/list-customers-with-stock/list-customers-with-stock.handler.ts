import { ListCustomersWithStockQuery } from './list-customers-with-stock.query';
import { CUSTOMER_QUERY_SERVICE } from '../../../../query-tokens';
import type { ICustomerQueryService } from '../../../../../domain/query-services/customer.query-service.interface';
export class ListCustomersWithStockHandler {
  constructor(
    protected readonly customerQueryService: ICustomerQueryService,
  ) {}

  async execute(query: ListCustomersWithStockQuery) {
    return this.customerQueryService.listCustomers({
      page: query.pagination.page,
      limit: query.pagination.limit,
      q: query.q,
      // identificationType replaced by cedula (simplify-schema-uta SDD)
      cedula: query.cedula,
    });
  }
}
