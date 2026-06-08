export class SaleDetail {
  id!: number;

  saleId!: string;

  productId!: string;

  productName!: string;

  productCode!: string;

  quantity!: number;

  unitPrice!: number;

  taxRateId!: string;

  taxPercentage!: number;

  taxAmount!: number;

  createdAt!: Date;

  constructor(partial: Partial<SaleDetail>) {
    Object.assign(this, partial);
  }
}
