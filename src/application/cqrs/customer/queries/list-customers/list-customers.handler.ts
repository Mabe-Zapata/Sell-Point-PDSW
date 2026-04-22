import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { ListCustomersQuery } from './list-customers.query';
import { ListCustomersValidator } from './list-customers.validator';
import { CustomerRepository } from '../../../../../infrastructure/repositories/customer.repository';
import { PaginatedResult } from '../../../../../domain/repositories/customer.repository.interface';
import { Customer } from '../../../../../domain/entities/customer.entity';

@QueryHandler(ListCustomersQuery)
export class ListCustomersHandler implements IQueryHandler<ListCustomersQuery> {
  constructor(
    private readonly validator: ListCustomersValidator,
    private readonly customerRepository: CustomerRepository,
  ) {}

  async execute(query: ListCustomersQuery): Promise<PaginatedResult<Customer>> {
    const validPagination = this.validator.validate(query.pagination);
    return this.customerRepository.findAll(validPagination, query.filters);
  }
}
