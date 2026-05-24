import { Injectable } from '@nestjs/common';

@Injectable()
export class ActivateCustomerValidator {
  validate(id: string): void {
    if (!id) {
      throw new Error('Customer ID is required');
    }
  }
}