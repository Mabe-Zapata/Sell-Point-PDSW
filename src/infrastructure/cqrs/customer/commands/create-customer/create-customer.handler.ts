import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { CreateCustomerCommand } from '../../../../../application/cqrs/customer/commands/create-customer/create-customer.command';
import { CreateCustomerHandler as ApplicationCreateCustomerHandler } from '../../../../../application/cqrs/customer/commands/create-customer/create-customer.handler';
import { CustomerRepository } from '../../../../repositories/customer.repository';
import { CUSTOMER_REPOSITORY } from '../../../../common/injection-tokens';

/**
 * Infrastructure wrapper that bridges the pure TypeScript handler
 * from application layer to NestJS CQRS module.
 *
 * This preserves Clean Architecture: handlers in application/ are
 * framework-agnostic, while infrastructure/ handles NestJS integration.
 */
@CommandHandler(CreateCustomerCommand)
export class CreateCustomerHandler implements ICommandHandler<CreateCustomerCommand> {
  private readonly appHandler: ApplicationCreateCustomerHandler;

  constructor(
    @Inject(CUSTOMER_REPOSITORY) customerRepository: CustomerRepository,
  ) {
    this.appHandler = new ApplicationCreateCustomerHandler(customerRepository);
  }

  async execute(command: CreateCustomerCommand) {
    return this.appHandler.execute(command);
  }
}
