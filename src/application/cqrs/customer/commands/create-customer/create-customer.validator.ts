import { Injectable } from '@nestjs/common';
import { CreateCustomerDto } from '../../../../dto/customer/create-customer.dto';

@Injectable()
export class CreateCustomerValidator {
  validate(payload: CreateCustomerDto): void {
    if (!payload.identificationNumber || payload.identificationNumber.trim().length === 0) {
      throw new BadRequestException('Identification number is required');
    }
    if (!payload.names || payload.names.trim().length === 0) {
      throw new BadRequestException('Customer names are required');
    }
  }
}
