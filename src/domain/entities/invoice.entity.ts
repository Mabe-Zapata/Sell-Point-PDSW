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

  constructor(partial: Partial<Invoice>) {
    Object.assign(this, partial);
  }
}
