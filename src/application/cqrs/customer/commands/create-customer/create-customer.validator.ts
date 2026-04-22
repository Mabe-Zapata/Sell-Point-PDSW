import { Injectable } from '@nestjs/common';
import { CustomerRepository } from '../../../../../infrastructure/repositories/customer.repository';
import { DuplicateCedulaException } from '../../../../../domain/exceptions/duplicate-cedula.exception';
import { CreateCustomerDto } from '../../../../dto/customer/create-customer.dto';

@Injectable()
export class CreateCustomerValidator {
  constructor(private readonly customerRepository: CustomerRepository) {}

  async validate(payload: CreateCustomerDto): Promise<void> {
    const existingCustomer = await this.customerRepository.findByCedula(
      payload.cedula,
    );
    if (existingCustomer) {
      throw new DuplicateCedulaException(payload.cedula);
    }
  }
}
