import { Injectable } from '@nestjs/common';
import { CustomerRepository } from '../../../../../infrastructure/repositories/customer.repository';
import { EntityNotFoundException } from '../../../../../domain/exceptions/entity-not-found.exception';
import { DuplicateCedulaException } from '../../../../../domain/exceptions/duplicate-cedula.exception';
import { Customer } from '../../../../../domain/entities/customer.entity';
import { UpdateCustomerDto } from '../../../../dto/customer/update-customer.dto';

@Injectable()
export class UpdateCustomerValidator {
  constructor(private readonly customerRepository: CustomerRepository) {}

  async validate(id: string, payload: UpdateCustomerDto): Promise<Customer> {
    const existingCustomer = await this.customerRepository.findById(id);
    if (!existingCustomer) {
      throw new EntityNotFoundException('Customer', id);
    }

    if (payload.cedula && payload.cedula !== existingCustomer.cedula) {
      const customerWithCedula = await this.customerRepository.findByCedula(
        payload.cedula,
      );
      if (customerWithCedula) {
        throw new DuplicateCedulaException(payload.cedula);
      }
    }

    return existingCustomer;
  }
}
