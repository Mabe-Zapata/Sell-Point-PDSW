import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { GetCustomerQuery } from './get-customer.query';
import { GetCustomerValidator } from './get-customer.validator';
import { Customer } from '../../../../../domain/entities/customer.entity';

@QueryHandler(GetCustomerQuery)
export class GetCustomerHandler implements IQueryHandler<GetCustomerQuery> {
  constructor(private readonly validator: GetCustomerValidator) {}

  async execute(query: GetCustomerQuery): Promise<Customer> {
    // La validación ya extrae el cliente si existe
    return this.validator.validate(query.id);
  }
}
