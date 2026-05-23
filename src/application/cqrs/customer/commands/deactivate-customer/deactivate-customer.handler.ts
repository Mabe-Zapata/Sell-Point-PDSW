import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { DeactivateCustomerCommand } from './deactivate-customer.command';
import { DeactivateCustomerValidator } from './deactivate-customer.validator';
import { CUSTOMER_REPOSITORY } from '../../../../tokens';
import type { ICustomerRepository } from '../../../../../domain/repositories';
import { EntityNotFoundException } from '../../../../../domain/exceptions/entity-not-found.exception';
import { Customer } from '../../../../../domain/entities/customer.entity';

@CommandHandler(DeactivateCustomerCommand)
export class DeactivateCustomerHandler implements ICommandHandler<DeactivateCustomerCommand> {
  constructor(
    private readonly validator: DeactivateCustomerValidator,
    @Inject(CUSTOMER_REPOSITORY) private readonly customerRepository: ICustomerRepository,
  ) {}

  async execute(command: DeactivateCustomerCommand): Promise<Customer> {
    this.validator.validate(command.id);

    const customer = await this.customerRepository.findById(command.id);
    if (!customer) {
      throw new EntityNotFoundException('Customer', command.id);
    }

    const deactivatedCustomer = new Customer({
      ...customer,
      isActive: false,
      updatedAt: new Date(),
    });

    return this.customerRepository.update(deactivatedCustomer);
  }
}