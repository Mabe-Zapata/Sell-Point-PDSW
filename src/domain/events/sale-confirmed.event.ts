export interface SaleConfirmedEventItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  lotCodes?: string[];
}

export class SaleConfirmedEvent {
  saleId: string;
  confirmedAt: Date;
  total: number;
  customerEmail?: string;
  customerName: string;
  details: SaleConfirmedEventItem[];
  invoiceId?: string;
  branchId?: string;

  constructor(
    saleId: string,
    confirmedAt: Date,
    total: number,
    customerEmail: string | undefined,
    customerName: string,
    details: SaleConfirmedEventItem[],
    invoiceId?: string,
    branchId?: string,
  ) {
    this.saleId = saleId;
    this.confirmedAt = confirmedAt;
    this.total = total;
    this.customerEmail = customerEmail;
    this.customerName = customerName;
    this.details = details;
    this.invoiceId = invoiceId;
    this.branchId = branchId;
  }
}
