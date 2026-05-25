import { randomUUID } from 'crypto';
import { CreateCustomerCommand } from './create-customer.command';
import type { ICustomerRepository } from '../../../../../domain/repositories';
import { DuplicateCedulaException } from '../../../../../domain/exceptions/duplicate-cedula.exception';
import { Customer } from '../../../../../domain/entities/customer.entity';

export class CreateCustomerHandler {
  constructor(
    protected readonly customerRepository: ICustomerRepository,
  ) {}

  async execute(command: CreateCustomerCommand): Promise<Customer> {
    if (command.payload.cedula) {
      const existing = await this.customerRepository.findByIdentificationNumber(
        command.payload.cedula,
      );
      if (existing) {
        throw new DuplicateCedulaException(command.payload.cedula);
      }
    }

    const customer = new Customer({
      id: randomUUID(),
      cedula: command.payload.cedula,
      firstName: command.payload.firstName,
      lastName: command.payload.lastName,
      email: command.payload.email,
      phone: command.payload.phone,
      address: command.payload.address ?? '',
      isActive: true,
    });

    return this.customerRepository.create(customer);
  }
}
