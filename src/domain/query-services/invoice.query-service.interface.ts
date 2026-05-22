import { Invoice } from '../entities';

export interface InvoiceListItem {
  id: string;
  saleId: string;
  seriesId: string;
  invoiceNumber: string;
  authorizationNumber: string;
  issueDate: Date;
  status: string;
  cancelledAt: Date | null;
  createdAt: Date;
  saleNumber: string;
  customerName: string;
  branchName: string;
  total: number;
}

export interface IInvoiceQueryService {
  listInvoices(params: {
    page: number;
    limit: number;
    branchId?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<{ data: InvoiceListItem[]; total: number; page: number; limit: number }>;
  getInvoiceBySaleId(saleId: string): Promise<InvoiceListItem | null>;
}