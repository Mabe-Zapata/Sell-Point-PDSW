import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { UpdateCustomerCommand } from '../../../../../application/cqrs/customer/commands/update-customer/update-customer.command';
import { UpdateCustomerHandler as ApplicationUpdateCustomerHandler } from '../../../../../application/cqrs/customer/commands/update-customer/update-customer.handler';
import { CustomerRepository } from '../../../../repositories/customer.repository';
import { CUSTOMER_REPOSITORY } from '../../../../common/injection-tokens';

@CommandHandler(UpdateCustomerCommand)
export class UpdateCustomerHandler implements ICommandHandler<UpdateCustomerCommand> {
  private readonly appHandler: ApplicationUpdateCustomerHandler;

  constructor(
    @Inject(CUSTOMER_REPOSITORY) customerRepository: CustomerRepository,
  ) {
    this.appHandler = new ApplicationUpdateCustomerHandler(customerRepository);
  }

  async execute(command: UpdateCustomerCommand) {
    return this.appHandler.execute(command);
  }
}
