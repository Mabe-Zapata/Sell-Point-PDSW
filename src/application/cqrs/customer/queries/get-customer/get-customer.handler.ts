import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { GetCustomerQuery } from './get-customer.query';
import { GetCustomerValidator } from './get-customer.validator';
import { CustomerRepository } from '../../../../../infrastructure/repositories/customer.repository';
import { EntityNotFoundException } from '../../../../../domain/exceptions/entity-not-found.exception';
import { Customer } from '../../../../../domain/entities/customer.entity';

@QueryHandler(GetCustomerQuery)
export class GetCustomerHandler implements IQueryHandler<GetCustomerQuery> {
  constructor(
    private readonly validator: GetCustomerValidator,
    private readonly customerRepository: CustomerRepository,
  ) {}

  async execute(query: GetCustomerQuery): Promise<Customer> {
    const id = this.validator.validate(query.id);
    const customer = await this.customerRepository.findById(id);
    if (!customer) {
      throw new EntityNotFoundException('Customer', id);
    }
    return customer;
  }
}
