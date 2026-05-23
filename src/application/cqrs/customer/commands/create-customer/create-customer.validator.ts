import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateCustomerDto } from '../../../../dto/customer/create-customer.dto';

@Injectable()
export class CreateCustomerValidator {
  validate(payload: CreateCustomerDto): void {
    if (!payload.names || payload.names.trim().length === 0) {
      throw new BadRequestException('Customer names are required');
    }
  }
}