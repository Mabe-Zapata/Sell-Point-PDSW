export interface CreatePaymentPayload {
  saleId: string;
  method: string;
  amount: number;
}

export class CreatePaymentCommand {
  constructor(
    public readonly payload: CreatePaymentPayload,
  ) {}
}