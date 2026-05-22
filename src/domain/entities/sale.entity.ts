import { SaleStatus } from './enums';

export class Sale {
  id!: string;

  branchId!: string;

  customerId!: string;

  cashierUserId!: string;

  taxRateId!: string;

  saleNumber!: string;

  status!: SaleStatus;

  subtotal!: number;

  taxAmount!: number;

  discountAmount!: number;

  total!: number;

  createdAt!: Date;

  updatedAt!: Date;

  constructor(partial: Partial<Sale>) {
    Object.assign(this, partial);
  }
}
