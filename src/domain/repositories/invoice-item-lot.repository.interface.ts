import { InvoiceItemLot } from '../entities/invoice-item-lot.entity';

export interface IInvoiceItemLotRepository {
  createMany(records: InvoiceItemLot[]): Promise<InvoiceItemLot[]>;
  findByInvoiceItemId(invoiceItemId: string): Promise<InvoiceItemLot[]>;
  findByInvoiceId(invoiceId: string): Promise<InvoiceItemLot[]>;
}
