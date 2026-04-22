import { InvoiceItem } from './invoice-item.entity';

export class Invoice {
  id: string;

  invoiceNumber: string;

  invoiceDate: Date;

  customerId: string;

  customerName?: string;

  subtotal: number;

  iva: number;

  total: number;

  items?: InvoiceItem[];

  createdAt: Date;

  updatedAt: Date;

  deletedAt?: Date;

  constructor(partial: Partial<Invoice>) {
    Object.assign(this, partial);
  }
}
