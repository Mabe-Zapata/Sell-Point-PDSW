import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { CreateCustomerCommand } from './create-customer.command';
import { CreateCustomerValidator } from './create-customer.validator';
import { CUSTOMER_REPOSITORY } from '../../../../tokens';
import type { ICustomerRepository } from '../../../../../domain/repositories';
import { DuplicateCedulaException } from '../../../../../domain/exceptions/duplicate-cedula.exception';
import { Customer } from '../../../../../domain/entities/customer.entity';

@CommandHandler(CreateCustomerCommand)
export class CreateCustomerHandler implements ICommandHandler<CreateCustomerCommand> {
  constructor(
    private readonly validator: CreateCustomerValidator,
    @Inject(CUSTOMER_REPOSITORY) private readonly customerRepository: ICustomerRepository,
  ) {}

  async execute(command: CreateCustomerCommand): Promise<Customer> {
    this.validator.validate(command.payload);

    const existing = await this.customerRepository.findByIdentificationNumber(
      command.payload.identificationNumber,
    );
    if (existing) {
      throw new DuplicateCedulaException(command.payload.identificationNumber);
    }

    const customer = new Customer({
      identificationType: command.payload.identificationType,
      identificationNumber: command.payload.identificationNumber,
      names: command.payload.names,
      email: command.payload.email,
      phone: command.payload.phone,
      address: command.payload.address,
    });

    return this.customerRepository.create(customer);
  }
}
