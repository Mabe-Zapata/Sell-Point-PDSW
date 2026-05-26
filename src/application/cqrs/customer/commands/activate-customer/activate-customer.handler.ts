import { ActivateCustomerCommand } from './activate-customer.command';
import type { ICustomerRepository } from '../../../../../domain/repositories';
import { EntityNotFoundException } from '../../../../../domain/exceptions/entity-not-found.exception';
import { Customer } from '../../../../../domain/entities/customer.entity';

export class ActivateCustomerHandler {
  constructor(
    protected readonly customerRepository: ICustomerRepository,
  ) {}

  async execute(command: ActivateCustomerCommand): Promise<Customer> {
    const customer = await this.customerRepository.findById(command.id);
    if (!customer) {
      throw new EntityNotFoundException('Customer', command.id);
    }

    // Use domain method - enforces business rules
    customer.activate();

    return this.customerRepository.update(customer);
  }
}
