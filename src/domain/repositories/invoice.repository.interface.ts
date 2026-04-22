import { Invoice } from '../entities/invoice.entity';
import {
  PaginationParams,
  PaginatedResult,
} from './customer.repository.interface';

// Re-export for convenience
export type {
  PaginationParams,
  PaginatedResult,
} from './customer.repository.interface';

export interface InvoiceFilters {
  id?: string;
  customer?: string;
}

/**
 * Invoice repository interface
 * Defines the contract for invoice data access operations
 */
export interface IInvoiceRepository {
  /**
   * Find an invoice by ID
   */
  findById(id: string): Promise<Invoice | null>;

  /**
   * Find all invoices with pagination and filters (excluding soft-deleted)
   */
  findAll(
    pagination?: PaginationParams,
    filters?: InvoiceFilters,
  ): Promise<PaginatedResult<Invoice>>;

  /**
   * Create a new invoice
   */
  create(invoice: Invoice): Promise<Invoice>;

  /**
   * Soft delete an invoice (mark as deleted)
   */
  softDelete(id: string): Promise<void>;

  /**
   * Count invoices starting with a specific prefix
   */
  countByInvoiceNumberPrefix(prefix: string): Promise<number>;
}
