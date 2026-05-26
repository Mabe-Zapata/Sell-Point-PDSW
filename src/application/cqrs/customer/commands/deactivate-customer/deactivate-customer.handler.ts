import { DeactivateCustomerCommand } from './deactivate-customer.command';
import type { ICustomerRepository } from '../../../../../domain/repositories';
import { EntityNotFoundException } from '../../../../../domain/exceptions/entity-not-found.exception';
import { Customer } from '../../../../../domain/entities/customer.entity';

export class DeactivateCustomerHandler {
  constructor(
    protected readonly customerRepository: ICustomerRepository,
  ) {}

  async execute(command: DeactivateCustomerCommand): Promise<Customer> {
    const customer = await this.customerRepository.findById(command.id);
    if (!customer) {
      throw new EntityNotFoundException('Customer', command.id);
    }

    // Use domain method - enforces business rules
    customer.deactivate();

    return this.customerRepository.update(customer);
  }
}
