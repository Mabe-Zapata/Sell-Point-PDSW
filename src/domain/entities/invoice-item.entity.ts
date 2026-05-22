export class InvoiceItem {
  id!: string;

  invoiceId!: string;

  productId!: string;

  productName?: string;

  quantity!: number;

  unitPrice!: number;

  constructor(partial: Partial<InvoiceItem>) {
    Object.assign(this, partial);
  }
}
