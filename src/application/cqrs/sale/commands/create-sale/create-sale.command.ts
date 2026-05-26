import { PaymentMethod } from '../../../../../domain/entities/enums/payment-method.enum';

export interface CreateSalePayload {
  branchId: string;
  customerId: string;
  cashierUserId: string;
  taxRateId: string;
  paymentMethod: PaymentMethod;
}

export class CreateSaleCommand {
  constructor(
    public readonly payload: CreateSalePayload,
  ) {}
}