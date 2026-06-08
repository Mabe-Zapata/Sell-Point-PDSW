import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { DeleteCustomerCommand } from '../../../../../application/cqrs/customer/commands/delete-customer/delete-customer.command';
import { DeleteCustomerHandler as ApplicationDeleteCustomerHandler } from '../../../../../application/cqrs/customer/commands/delete-customer/delete-customer.handler';
import { CustomerRepository } from '../../../../repositories/customer.repository';
import { CUSTOMER_REPOSITORY } from '../../../../common/injection-tokens';

@CommandHandler(DeleteCustomerCommand)
export class DeleteCustomerHandler implements ICommandHandler<DeleteCustomerCommand> {
  private readonly appHandler: ApplicationDeleteCustomerHandler;

  constructor(
    @Inject(CUSTOMER_REPOSITORY) customerRepository: CustomerRepository,
  ) {
    this.appHandler = new ApplicationDeleteCustomerHandler(customerRepository);
  }

  async execute(command: DeleteCustomerCommand) {
    return this.appHandler.execute(command);
  }
}
