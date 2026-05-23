import { Injectable } from '@nestjs/common';
import { CreatePaymentPayload } from './create-payment.command';
import { PaymentMethod } from '../../../../../domain/entities';
import { BusinessRuleException } from '../../../../../domain/exceptions/business-rule.exception';

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
    // R26: Payment method CASH only enforcement
    if (payload.method !== PaymentMethod.CASH) {
      throw new BusinessRuleException('Payment method not yet enabled');
    }
  }
}