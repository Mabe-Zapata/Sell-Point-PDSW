import { Injectable } from '@nestjs/common';

@Injectable()
export class DeactivateCustomerValidator {
  validate(id: string): void {
    if (!id) {
      throw new Error('Customer ID is required');
    }
  }
}