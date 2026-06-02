export interface InvoiceIssuedEventItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  lotCodes?: string[];
}

export class InvoiceIssuedEvent {
  constructor(
    public readonly invoiceId: string,
    public readonly saleId: string,
    public readonly invoiceNumber: string,
    public readonly customerEmail: string,
    public readonly customerName: string,
    public readonly issueDate: Date,
    public readonly total: number,
    public readonly subtotal: number,
    public readonly iva: number,
    public readonly items: InvoiceIssuedEventItem[],
  ) {}
}
