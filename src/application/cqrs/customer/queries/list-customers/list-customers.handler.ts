import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ListCustomersQuery } from './list-customers.query';
import { ListCustomersValidator } from './list-customers.validator';
import { CUSTOMER_REPOSITORY } from '../../../../tokens';
import type { ICustomerRepository } from '../../../../../domain/repositories';
import { PaginatedResult } from '../../../../../domain/repositories/pagination.types';
import { Customer } from '../../../../../domain/entities/customer.entity';

@QueryHandler(ListCustomersQuery)
export class ListCustomersHandler implements IQueryHandler<ListCustomersQuery> {
  constructor(
    private readonly validator: ListCustomersValidator,
    @Inject(CUSTOMER_REPOSITORY) private readonly customerRepository: ICustomerRepository,
  ) {}

  async execute(query: ListCustomersQuery): Promise<PaginatedResult<Customer>> {
    const validPagination = this.validator.validate(query.pagination);
    return this.customerRepository.findAll(validPagination, query.filters);
  }
}
