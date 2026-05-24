import { Invoice } from '../../../domain/entities';

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

  constructor(invoice: Invoice) {
    this.id = invoice.id;
    this.saleId = invoice.saleId;
    this.seriesId = invoice.seriesId;
    this.invoiceNumber = invoice.invoiceNumber;
    this.authorizationNumber = invoice.authorizationNumber;
    this.issueDate = invoice.issueDate;
    this.status = invoice.status;
    this.cancelledAt = invoice.cancelledAt;
    this.createdAt = invoice.createdAt;
  }

  static fromEntity(invoice: Invoice): InvoiceResponseDto {
    return new InvoiceResponseDto(invoice);
  }

  static fromEntities(invoices: Invoice[]): InvoiceResponseDto[] {
    return invoices.map((invoice) => new InvoiceResponseDto(invoice));
  }
}
