import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ListCustomersQuery } from '../../../../../application/cqrs/customer/queries/list-customers/list-customers.query';
import { ListCustomersHandler as ApplicationListCustomersHandler } from '../../../../../application/cqrs/customer/queries/list-customers/list-customers.handler';
import { CustomerRepository } from '../../../../repositories/customer.repository';
import { CUSTOMER_REPOSITORY } from '../../../../common/injection-tokens';

@QueryHandler(ListCustomersQuery)
export class ListCustomersHandler implements IQueryHandler<ListCustomersQuery> {
  private readonly appHandler: ApplicationListCustomersHandler;

  constructor(
    @Inject(CUSTOMER_REPOSITORY) customerRepository: CustomerRepository,
  ) {
    this.appHandler = new ApplicationListCustomersHandler(customerRepository);
  }

  async execute(query: ListCustomersQuery) {
    return this.appHandler.execute(query);
  }
}
