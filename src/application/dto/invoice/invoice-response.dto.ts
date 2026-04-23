import { Invoice } from '../../../domain/entities/invoice.entity';
import { InvoiceItem } from '../../../domain/entities/invoice-item.entity';

export class InvoiceItemResponseDto {
  id: string;

  productId: string;

  quantity: number;

  unitPrice: number;

  constructor(item: InvoiceItem) {
    this.id = item.id;
    this.productId = item.productId;
    this.quantity = item.quantity;
    this.unitPrice = item.unitPrice;
  }

  static fromEntity(item: InvoiceItem): InvoiceItemResponseDto {
    return new InvoiceItemResponseDto(item);
  }

  static fromEntities(items: InvoiceItem[]): InvoiceItemResponseDto[] {
    return items.map((item) => new InvoiceItemResponseDto(item));
  }
}

export class InvoiceResponseDto {
  id: string;

  invoiceNumber: string;

  invoiceDate: Date;

  customerId: string;

  customerName?: string;

  subtotal: number;

  iva: number;

  total: number;

  items?: InvoiceItemResponseDto[];

  createdAt: Date;

  updatedAt: Date;

  constructor(invoice: Invoice) {
    this.id = invoice.id;
    this.invoiceNumber = invoice.invoiceNumber;
    this.invoiceDate = invoice.invoiceDate;
    this.customerId = invoice.customerId;
    this.customerName = invoice.customerName;
    this.subtotal = invoice.subtotal;
    this.iva = invoice.iva;
    this.total = invoice.total;
    this.items = invoice.items
      ? invoice.items.map((item) => new InvoiceItemResponseDto(item))
      : undefined;
    this.createdAt = invoice.createdAt;
    this.updatedAt = invoice.updatedAt;
  }

  static fromEntity(invoice: Invoice): InvoiceResponseDto {
    return new InvoiceResponseDto(invoice);
  }

  static fromEntities(invoices: Invoice[]): InvoiceResponseDto[] {
    return invoices.map((invoice) => new InvoiceResponseDto(invoice));
  }
}
