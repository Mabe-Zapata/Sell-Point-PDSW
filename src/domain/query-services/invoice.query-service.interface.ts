import { PaginatedResult } from '../repositories/pagination.types';

export interface InvoiceListItem {
  id: string;
  saleId: string;
  seriesId: string;
  invoiceNumber: string;
  authorizationNumber: string | null;
  issueDate: Date;
  status: string;
  cancelledAt: Date | null;
  createdAt: Date;
  saleNumber: string;
  customerName: string;
  customerIdentificationNumber: string;
  branchName: string;
  total: number;
  establishmentCode: string;
  emissionPointCode: string;
}

export interface IInvoiceQueryService {
  listInvoices(params: {
    page: number;
    limit: number;
    branchId?: string;
    status?: string;
    invoiceNumber?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<PaginatedResult<InvoiceListItem>>;
  getInvoiceBySaleId(saleId: string): Promise<InvoiceListItem | null>;
}
