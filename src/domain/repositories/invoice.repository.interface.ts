import { Invoice } from '../entities';
import { PaginationParams, PaginatedResult } from './customer.repository.interface';

export interface InvoiceFilters {
  saleId?: string;
  seriesId?: string;
  status?: string;
  authorizationNumber?: string;
}

export interface IInvoiceRepository {
  findById(id: string): Promise<Invoice | null>;
  findBySaleId(saleId: string): Promise<Invoice | null>;
  findAll(
    pagination?: PaginationParams,
    filters?: InvoiceFilters,
  ): Promise<PaginatedResult<Invoice>>;
  create(invoice: Invoice): Promise<Invoice>;
  update(invoice: Invoice): Promise<Invoice>;
}