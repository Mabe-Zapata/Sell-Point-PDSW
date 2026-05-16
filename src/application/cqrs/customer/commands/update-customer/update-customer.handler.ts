import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateCustomerCommand } from './update-customer.command';
import { UpdateCustomerValidator } from './update-customer.validator';
import { CustomerRepository } from '../../../../../infrastructure/repositories/customer.repository';
import { Customer } from '../../../../../domain/entities/customer.entity';

@CommandHandler(UpdateCustomerCommand)
export class UpdateCustomerHandler implements ICommandHandler<UpdateCustomerCommand> {
  constructor(
    private readonly validator: UpdateCustomerValidator,
    private readonly customerRepository: CustomerRepository,
  ) {}

  async execute(command: UpdateCustomerCommand): Promise<Customer> {
    const existingCustomer = await this.validator.validate(
      command.id,
      command.payload,
    );
    const { payload } = command;

    const updatedCustomer = new Customer({
      id: existingCustomer.id,
      name: payload.name ?? existingCustomer.name,
      lastName: payload.lastName ?? existingCustomer.lastName,
      cedula: payload.cedula ?? existingCustomer.cedula,
      email:
        payload.email !== undefined ? payload.email : existingCustomer.email,
      phone:
        payload.phone !== undefined ? payload.phone : existingCustomer.phone,
      address:
        payload.address !== undefined
          ? payload.address
          : existingCustomer.address,
      createdAt: existingCustomer.createdAt,
      updatedAt: new Date(),
    });

    return this.customerRepository.update(updatedCustomer);
  }
}
