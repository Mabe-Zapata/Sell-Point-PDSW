import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateCustomerCommand } from './update-customer.command';
import { UpdateCustomerValidator } from './update-customer.validator';
import { CustomerRepository } from '../../../../../infrastructure/repositories/customer.repository';
import { EntityNotFoundException } from '../../../../../domain/exceptions/entity-not-found.exception';
import { DuplicateCedulaException } from '../../../../../domain/exceptions/duplicate-cedula.exception';
import { Customer } from '../../../../../domain/entities/customer.entity';

@CommandHandler(UpdateCustomerCommand)
export class UpdateCustomerHandler implements ICommandHandler<UpdateCustomerCommand> {
  constructor(
    private readonly validator: UpdateCustomerValidator,
    private readonly customerRepository: CustomerRepository,
  ) {}

  async execute(command: UpdateCustomerCommand): Promise<Customer> {
    const validated = this.validator.validate(command.id, command.payload);

    const existingCustomer = await this.customerRepository.findById(command.id);
    if (!existingCustomer) {
      throw new EntityNotFoundException('Customer', command.id);
    }

    if (validated.cedula && validated.cedula !== existingCustomer.identificationNumber) {
      const customerWithCedula = await this.customerRepository.findByIdentificationNumber(
        validated.cedula,
      );
      if (customerWithCedula) {
        throw new DuplicateCedulaException(validated.cedula);
      }
    }

    const { payload } = command;

    const updatedCustomer = new Customer({
      id: existingCustomer.id,
      identificationType: payload.identificationType ?? existingCustomer.identificationType,
      identificationNumber: payload.cedula ?? existingCustomer.identificationNumber,
      names: payload.names ?? existingCustomer.names,
      email: payload.email !== undefined ? payload.email : existingCustomer.email,
      phone: payload.phone !== undefined ? payload.phone : existingCustomer.phone,
      address: payload.address !== undefined ? payload.address : existingCustomer.address,
      createdAt: existingCustomer.createdAt,
      updatedAt: new Date(),
    });

    return this.customerRepository.update(updatedCustomer);
  }
}
