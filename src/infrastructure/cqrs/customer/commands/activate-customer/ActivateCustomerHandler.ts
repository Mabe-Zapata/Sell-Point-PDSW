import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ActivateCustomerCommand } from '../../../../../application/cqrs/customer/commands/activate-customer/activate-customer.command';
import { ActivateCustomerHandler as ApplicationActivateCustomerHandler } from '../../../../../application/cqrs/customer/commands/activate-customer/activate-customer.handler';
import { CustomerRepository } from '../../../../repositories/customer.repository';
import { CUSTOMER_REPOSITORY } from '../../../../common/injection-tokens';

@CommandHandler(ActivateCustomerCommand)
export class ActivateCustomerHandler implements ICommandHandler<ActivateCustomerCommand> {
  private readonly appHandler: ApplicationActivateCustomerHandler;

  constructor(
    @Inject(CUSTOMER_REPOSITORY) customerRepository: CustomerRepository,
  ) {
    this.appHandler = new ApplicationActivateCustomerHandler(customerRepository);
  }

  async execute(command: ActivateCustomerCommand) {
    return this.appHandler.execute(command);
  }
}
