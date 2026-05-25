import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateCustomerDto } from '../../../../dto/customer/create-customer.dto';

@Injectable()
export class CreateCustomerValidator {
  validate(payload: CreateCustomerDto): void {
    if (!payload.firstName || payload.firstName.trim().length === 0) {
      throw new BadRequestException('Customer first name is required');
    }
    if (!payload.lastName || payload.lastName.trim().length === 0) {
      throw new BadRequestException('Customer last name is required');
    }
    if (!payload.cedula || payload.cedula.trim().length === 0) {
      throw new BadRequestException('Cedula is required');
    }
  }
}