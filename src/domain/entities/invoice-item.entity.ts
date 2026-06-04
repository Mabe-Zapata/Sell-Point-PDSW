export class InvoiceItem {
  id!: string;
  invoiceId!: string;
  productId!: string;
  productName!: string;
  quantity!: number;
  unitPrice!: number;
  taxRateId?: string;
  taxPercentage?: number;
  taxAmount?: number;

  get subtotal(): number {
    return this.quantity * this.unitPrice;
  }

  get total(): number {
    return this.subtotal + (this.taxAmount ?? 0);
  }

  constructor(partial: Partial<InvoiceItem>) {
    Object.assign(this, partial);
  }
}
