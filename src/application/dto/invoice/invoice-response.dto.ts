import { Invoice } from '../../../domain/entities';
import { InvoiceItemResponseDto } from './invoice-item.dto';

export class InvoiceResponseDto {
  id: string;
  saleId: string;
  seriesId: string;
  invoiceNumber: string;
  authorizationNumber?: string;
  issueDate: Date;
  status: string;
  cancelledAt?: Date;
  createdAt: Date;
  total?: number;
  subtotal?: number;
  iva?: number;
  saleNumber?: string;
  customerId?: string;
  customerName?: string;
  customerCedula?: string;
  cashierUserId?: string;
  cashierName?: string;
  items?: InvoiceItemResponseDto[];
  // Audit snapshots
  customerNameSnapshot?: string;
  customerCedulaSnapshot?: string;
  customerEmailSnapshot?: string;
  cashierNameSnapshot?: string;
  cashierUsernameSnapshot?: string;
  cashierEmployeeIdSnapshot?: string;

  constructor(invoice: Invoice, items?: InvoiceItemResponseDto[]) {
    this.id = invoice.id;
    this.saleId = invoice.saleId;
    this.seriesId = invoice.seriesId;
    this.invoiceNumber = invoice.invoiceNumber;
    this.authorizationNumber = invoice.authorizationNumber;
    this.issueDate = invoice.issueDate;
    this.status = invoice.status;
    this.cancelledAt = invoice.cancelledAt;
    this.createdAt = invoice.createdAt;
    this.total = invoice.total;
    this.subtotal = invoice.subtotal;
    this.iva = invoice.iva;
    this.saleNumber = invoice.saleNumber;
    this.customerId = invoice.customerId;
    this.cashierName = invoice.cashierName;
    this.cashierUserId = invoice.cashierUserId;
    this.items = items;
    // Audit snapshots
    this.customerNameSnapshot = invoice.customerNameSnapshot;
    this.customerCedulaSnapshot = invoice.customerCedulaSnapshot;
    this.customerEmailSnapshot = invoice.customerEmailSnapshot;
    this.cashierNameSnapshot = invoice.cashierNameSnapshot;
    this.cashierUsernameSnapshot = invoice.cashierUsernameSnapshot;
    this.cashierEmployeeIdSnapshot = invoice.cashierEmployeeIdSnapshot;
  }

  static fromEntity(invoice: Invoice, items?: InvoiceItemResponseDto[]): InvoiceResponseDto {
    return new InvoiceResponseDto(invoice, items);
  }
}
