import { ListCustomersQuery } from './list-customers.query';
import { CUSTOMER_REPOSITORY } from '../../../../tokens';
import type { ICustomerRepository } from '../../../../../domain/repositories';
import { PaginatedResult } from '../../../../../domain/repositories/pagination.types';
import { Customer } from '../../../../../domain/entities/customer.entity';export class ListCustomersHandler {
  constructor(
    protected readonly customerRepository: ICustomerRepository,
  ) {}

  async execute(query: ListCustomersQuery): Promise<PaginatedResult<Customer>> {
    return this.customerRepository.findAll(query.pagination, query.filters);
  }
}
