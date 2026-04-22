import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateCustomerCommand } from './create-customer.command';
import { CreateCustomerValidator } from './create-customer.validator';
import { CustomerRepository } from '../../../../../infrastructure/repositories/customer.repository';
import { Customer } from '../../../../../domain/entities/customer.entity';

@CommandHandler(CreateCustomerCommand)
export class CreateCustomerHandler implements ICommandHandler<CreateCustomerCommand> {
  constructor(
    private readonly validator: CreateCustomerValidator,
    private readonly customerRepository: CustomerRepository,
  ) {}

  async execute(command: CreateCustomerCommand): Promise<Customer> {
    await this.validator.validate(command.payload);

    const customer = new Customer({
      name: command.payload.name,
      lastName: command.payload.lastName,
      cedula: command.payload.cedula,
      email: command.payload.email,
      phone: command.payload.phone,
      address: command.payload.address,
    });

    return this.customerRepository.create(customer);
  }
}
