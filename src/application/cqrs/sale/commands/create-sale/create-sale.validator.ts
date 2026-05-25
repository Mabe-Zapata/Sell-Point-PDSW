import { CreateSalePayload } from './create-sale.command';export class CreateSaleValidator {
  static validate(payload: CreateSalePayload): void {
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