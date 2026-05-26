export class InvoiceItem {
  id!: string;
  invoiceId!: string;
  productId!: string;
  productName!: string;
  quantity!: number;
  unitPrice!: number;

  get subtotal(): number {
    return this.quantity * this.unitPrice;
  }

  constructor(partial: Partial<InvoiceItem>) {
    Object.assign(this, partial);
  }
}
