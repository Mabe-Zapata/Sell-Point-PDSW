import { UpdateCustomerCommand } from './update-customer.command';
import type { ICustomerRepository } from '../../../../../domain/repositories';
import { EntityNotFoundException } from '../../../../../domain/exceptions/entity-not-found.exception';
import { DuplicateCedulaException } from '../../../../../domain/exceptions/duplicate-cedula.exception';
import { Customer } from '../../../../../domain/entities/customer.entity';

export class UpdateCustomerHandler {
  constructor(
    protected readonly customerRepository: ICustomerRepository,
  ) {}

  async execute(command: UpdateCustomerCommand): Promise<Customer> {
    const existingCustomer = await this.customerRepository.findById(command.id);
    if (!existingCustomer) {
      throw new EntityNotFoundException('Customer', command.id);
    }

    if (command.payload.cedula && command.payload.cedula !== existingCustomer.cedula) {
      const customerWithCedula = await this.customerRepository.findByIdentificationNumber(
        command.payload.cedula,
      );
      if (customerWithCedula) {
        throw new DuplicateCedulaException(command.payload.cedula);
      }
    }

    const { payload } = command;

    const updatedCustomer = new Customer({
      id: existingCustomer.id,
      cedula: payload.cedula ?? existingCustomer.cedula,
      firstName: payload.firstName ?? existingCustomer.firstName,
      lastName: payload.lastName ?? existingCustomer.lastName,
      email: payload.email !== undefined ? payload.email : existingCustomer.email,
      phone: payload.phone !== undefined ? payload.phone : existingCustomer.phone,
      address: payload.address !== undefined ? payload.address : existingCustomer.address,
      isActive: existingCustomer.isActive,
      createdAt: existingCustomer.createdAt,
    });

    return this.customerRepository.update(updatedCustomer);
  }
}
