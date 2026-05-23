import { Injectable } from '@nestjs/common';
import { CreatePaymentPayload } from './create-payment.command';

@Injectable()
export class CreatePaymentValidator {
  validate(payload: CreatePaymentPayload): void {
    if (!payload.saleId) {
      throw new Error('Sale ID is required');
    }
    if (!payload.method) {
      throw new Error('Payment method is required');
    }
    if (payload.amount <= 0) {
      throw new Error('Payment amount must be greater than 0');
    }
  }
}