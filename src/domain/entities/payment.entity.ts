import { PaymentMethod } from './enums';

export class Payment {
  id!: string;

  saleId!: string;

  method!: PaymentMethod;

  amount!: number;

  reference?: string;

  paidAt!: Date;

  createdAt!: Date;

  constructor(partial: Partial<Payment>) {
    Object.assign(this, partial);
  }
}
