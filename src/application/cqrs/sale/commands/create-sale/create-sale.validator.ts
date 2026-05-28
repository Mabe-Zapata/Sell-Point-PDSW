import { PaymentMethod } from '../../../../../domain/entities/enums/payment-method.enum';
import { CreateSalePayload } from './create-sale.command';

export class CreateSaleValidator {
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
    if (!payload.paymentMethod) {
      throw new Error('Payment method is required');
    }
    if (payload.paymentMethod !== PaymentMethod.CASH) {
      throw new Error('Only CASH payment method is accepted');
    }
  }
}