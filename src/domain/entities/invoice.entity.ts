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

  // Computed for PDF only (fetched via JOIN at query time, not stored)
   
  [key: string]: any;

  constructor(partial: Partial<Invoice>) {
    Object.assign(this, partial);
  }
}