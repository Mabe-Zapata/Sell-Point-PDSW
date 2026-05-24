import { Injectable } from '@nestjs/common';
import { CreateSalePayload } from './create-sale.command';

@Injectable()
export class CreateSaleValidator {
  validate(payload: CreateSalePayload): void {
    if (!payload.branchId) {
      throw new Error('Branch ID is required');
    }
    if (!payload.customerId) {
      throw new Error('Customer ID is required');
    }
    if (!payload.cashierUserId) {
      throw new Error('Cashier user ID is required');
    }
    if (!payload.taxRateId) {
      throw new Error('Tax rate ID is required');
    }
  }
}