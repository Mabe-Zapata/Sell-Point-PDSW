import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeleteCustomerCommand } from './delete-customer.command';
import { DeleteCustomerValidator } from './delete-customer.validator';
import { CustomerRepository } from '../../../../../infrastructure/repositories/customer.repository';
import { EntityNotFoundException } from '../../../../../domain/exceptions/entity-not-found.exception';

@CommandHandler(DeleteCustomerCommand)
export class DeleteCustomerHandler implements ICommandHandler<DeleteCustomerCommand> {
  constructor(
    private readonly validator: DeleteCustomerValidator,
    private readonly customerRepository: CustomerRepository,
  ) {}

  async execute(command: DeleteCustomerCommand): Promise<void> {
    const id = this.validator.validate(command.id);
    const customer = await this.customerRepository.findById(id);
    if (!customer) {
      throw new EntityNotFoundException('Customer', id);
    }
    await this.customerRepository.softDelete(id);
  }
}
