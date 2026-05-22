import { InvoiceStatus } from './enums';

export class Invoice {
  id!: string;

  // Legacy compatibility fields used by application/presentation layer
  customerId?: string;

  customerName?: string;

  invoiceDate?: Date;

  subtotal?: number;

  iva?: number;

  total?: number;

  items?: any[];

  updatedAt?: Date;

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
