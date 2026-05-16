import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeleteCustomerCommand } from './delete-customer.command';
import { DeleteCustomerValidator } from './delete-customer.validator';
import { CustomerRepository } from '../../../../../infrastructure/repositories/customer.repository';

@CommandHandler(DeleteCustomerCommand)
export class DeleteCustomerHandler implements ICommandHandler<DeleteCustomerCommand> {
  constructor(
    private readonly validator: DeleteCustomerValidator,
    private readonly customerRepository: CustomerRepository,
  ) {}

  async execute(command: DeleteCustomerCommand): Promise<void> {
    await this.validator.validate(command.id);
    await this.customerRepository.softDelete(command.id);
  }
}
