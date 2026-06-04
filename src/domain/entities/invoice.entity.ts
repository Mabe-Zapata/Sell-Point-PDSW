import { InvoiceStatus } from './enums';

export class Invoice {
  id!: string;
  saleId!: string;
  seriesId!: string;
  invoiceNumber!: string;
  authorizationNumber?: string;
  issueDate!: Date;
  status!: InvoiceStatus;
  cancelledAt?: Date;
  createdAt!: Date;

  // Read/display fields (fetched via JOIN at query time, not stored in INVOICES table)
  total?: number;
  subtotal?: number;
  iva?: number;
  saleNumber?: string;
  customerName?: string;
  customerId?: string;
  customerCedula?: string;
  establishmentCode?: string;
  emissionPointCode?: string;

  // Alias for PDF display (maps to issueDate)
  invoiceDate?: Date;

  constructor(partial: Partial<Invoice>) {
    Object.assign(this, partial);
  }
}
