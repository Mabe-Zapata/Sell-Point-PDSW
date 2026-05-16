import { InvoiceItem } from '../entities/invoice-item.entity';

/**
 * InvoiceItem repository interface
 * Defines the contract for invoice item data access operations
 */
export interface IInvoiceItemRepository {
  /**
   * Create multiple invoice items in a single operation
   */
  createMany(items: InvoiceItem[]): Promise<InvoiceItem[]>;

  /**
   * Find all items for a specific invoice
   */
  findByInvoiceId(invoiceId: string): Promise<InvoiceItem[]>;
}
