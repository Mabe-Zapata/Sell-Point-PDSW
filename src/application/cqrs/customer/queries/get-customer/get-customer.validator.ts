import { Injectable } from '@nestjs/common';
import { CustomerRepository } from '../../../../../infrastructure/repositories/customer.repository';
import { EntityNotFoundException } from '../../../../../domain/exceptions/entity-not-found.exception';
import { Customer } from '../../../../../domain/entities/customer.entity';

@Injectable()
export class GetCustomerValidator {
  constructor(private readonly customerRepository: CustomerRepository) {}

  async validate(id: string): Promise<Customer> {
    const customer = await this.customerRepository.findById(id);
    if (!customer) {
      throw new EntityNotFoundException('Customer', id);
    }
    return customer;
  }
}
