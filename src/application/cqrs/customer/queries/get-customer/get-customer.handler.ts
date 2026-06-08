import { GetCustomerQuery } from './get-customer.query';
import { CUSTOMER_REPOSITORY } from '../../../../tokens';
import type { ICustomerRepository } from '../../../../../domain/repositories';
import { EntityNotFoundException } from '../../../../../domain/exceptions/entity-not-found.exception';
import { Customer } from '../../../../../domain/entities/customer.entity';
export class GetCustomerHandler {
  constructor(
    protected readonly customerRepository: ICustomerRepository,
  ) {}

  async execute(query: GetCustomerQuery): Promise<Customer> {
    const id = query.id;
    const customer = await this.customerRepository.findById(id);
    if (!customer) {
      throw new EntityNotFoundException('Customer', id);
    }
    return customer;
  }
}
