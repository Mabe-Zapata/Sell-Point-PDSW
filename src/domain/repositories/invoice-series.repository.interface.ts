import { InvoiceSeries } from '../entities';
import { PaginationParams, PaginatedResult } from './pagination.types';

export interface InvoiceSeriesFilters {
  branchId?: string;
  isActive?: boolean;
}

export interface IInvoiceSeriesRepository {
  findById(id: string): Promise<InvoiceSeries | null>;
  findActiveByBranchId(branchId: string): Promise<InvoiceSeries | null>;
  findAll(
    pagination?: PaginationParams,
    filters?: InvoiceSeriesFilters,
  ): Promise<PaginatedResult<InvoiceSeries>>;
  create(invoiceSeries: InvoiceSeries): Promise<InvoiceSeries>;
  update(invoiceSeries: InvoiceSeries): Promise<InvoiceSeries>;
  incrementSequence(id: number): Promise<number>;
}
