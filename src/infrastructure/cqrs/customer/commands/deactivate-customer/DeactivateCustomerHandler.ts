import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { DeactivateCustomerCommand } from '../../../../../application/cqrs/customer/commands/deactivate-customer/deactivate-customer.command';
import { DeactivateCustomerHandler as ApplicationDeactivateCustomerHandler } from '../../../../../application/cqrs/customer/commands/deactivate-customer/deactivate-customer.handler';
import { CustomerRepository } from '../../../../repositories/customer.repository';
import { CUSTOMER_REPOSITORY } from '../../../../common/injection-tokens';

@CommandHandler(DeactivateCustomerCommand)
export class DeactivateCustomerHandler implements ICommandHandler<DeactivateCustomerCommand> {
  private readonly appHandler: ApplicationDeactivateCustomerHandler;

  constructor(
    @Inject(CUSTOMER_REPOSITORY) customerRepository: CustomerRepository,
  ) {
    this.appHandler = new ApplicationDeactivateCustomerHandler(customerRepository);
  }

  async execute(command: DeactivateCustomerCommand) {
    return this.appHandler.execute(command);
  }
}
