import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ActivateCustomerCommand } from './activate-customer.command';
import { ActivateCustomerValidator } from './activate-customer.validator';
import { CUSTOMER_REPOSITORY } from '../../../../tokens';
import type { ICustomerRepository } from '../../../../../domain/repositories';
import { EntityNotFoundException } from '../../../../../domain/exceptions/entity-not-found.exception';
import { Customer } from '../../../../../domain/entities/customer.entity';

@CommandHandler(ActivateCustomerCommand)
export class ActivateCustomerHandler implements ICommandHandler<ActivateCustomerCommand> {
  constructor(
    private readonly validator: ActivateCustomerValidator,
    @Inject(CUSTOMER_REPOSITORY) private readonly customerRepository: ICustomerRepository,
  ) {}

  async execute(command: ActivateCustomerCommand): Promise<Customer> {
    this.validator.validate(command.id);

    const customer = await this.customerRepository.findById(command.id);
    if (!customer) {
      throw new EntityNotFoundException('Customer', command.id);
    }

    // Use domain method - enforces business rules
    customer.activate();

    return this.customerRepository.update(customer);
  }
}