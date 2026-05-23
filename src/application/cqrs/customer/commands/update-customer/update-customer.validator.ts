import { Injectable, BadRequestException } from '@nestjs/common';
import { UpdateCustomerDto } from '../../../../dto/customer/update-customer.dto';

export interface ValidatedUpdateCustomer {
  id: string;
  cedula?: string;
}

@Injectable()
export class UpdateCustomerValidator {
  validate(id: string, payload: UpdateCustomerDto): ValidatedUpdateCustomer {
    if (!id || id.trim().length === 0) {
      throw new BadRequestException('Customer id is required');
    }
    return { id, cedula: payload.cedula };
  }
}