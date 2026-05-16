import { Injectable } from '@nestjs/common';
import { CustomerRepository } from '../../../../../infrastructure/repositories/customer.repository';
import { EntityNotFoundException } from '../../../../../domain/exceptions/entity-not-found.exception';

@Injectable()
export class DeleteCustomerValidator {
  constructor(private readonly customerRepository: CustomerRepository) {}

  async validate(id: string): Promise<void> {
    const customer = await this.customerRepository.findById(id);
    if (!customer) {
      throw new EntityNotFoundException('Customer', id);
    }
  }
}
