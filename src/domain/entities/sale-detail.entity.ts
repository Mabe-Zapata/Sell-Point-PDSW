export class SaleDetail {
  id!: string;

  saleId!: string;

  productId!: string;

  productName!: string;

  productCode!: string;

  quantity!: number;

  unitPrice!: number;

  createdAt!: Date;

  constructor(partial: Partial<SaleDetail>) {
    Object.assign(this, partial);
  }
}
