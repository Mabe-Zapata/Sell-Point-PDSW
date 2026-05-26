import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetCustomerQuery } from '../../../../../application/cqrs/customer/queries/get-customer/get-customer.query';
import { GetCustomerHandler as ApplicationGetCustomerHandler } from '../../../../../application/cqrs/customer/queries/get-customer/get-customer.handler';
import { CustomerRepository } from '../../../../repositories/customer.repository';
import { CUSTOMER_REPOSITORY } from '../../../../common/injection-tokens';

@QueryHandler(GetCustomerQuery)
export class GetCustomerHandler implements IQueryHandler<GetCustomerQuery> {
  private readonly appHandler: ApplicationGetCustomerHandler;

  constructor(
    @Inject(CUSTOMER_REPOSITORY) customerRepository: CustomerRepository,
  ) {
    this.appHandler = new ApplicationGetCustomerHandler(customerRepository);
  }

  async execute(query: GetCustomerQuery) {
    return this.appHandler.execute(query);
  }
}
