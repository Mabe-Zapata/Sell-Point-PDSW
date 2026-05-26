export interface SaleConfirmedEventItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export class SaleConfirmedEvent {
  saleId: string;
  confirmedAt: Date;
  total: number;
  customerEmail: string;
  customerName: string;
  details: SaleConfirmedEventItem[];

  constructor(
    saleId: string,
    confirmedAt: Date,
    total: number,
    customerEmail: string,
    customerName: string,
    details: SaleConfirmedEventItem[],
  ) {
    this.saleId = saleId;
    this.confirmedAt = confirmedAt;
    this.total = total;
    this.customerEmail = customerEmail;
    this.customerName = customerName;
    this.details = details;
  }
}