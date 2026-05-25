import { Invoice, InvoiceItem } from '../../domain/entities';

/**
 * Injection token for the PDF service
 * Use this token when injecting IPdfService via NestJS DI
 */
export const PDF_SERVICE = 'PDF_SERVICE';

/**
 * PDF Service interface
 * Defines the contract for generating PDF documents.
 * Depends on a port interface in the application layer so that
 * the concrete implementation is interchangeable without modifying use cases.
 */
export interface IPdfService {
  /**
   * Generate a PDF buffer for an invoice
   * @param invoice The invoice to generate PDF for
   * @param items The invoice items
   * @returns A Buffer containing the PDF data
   */
  generateInvoicePdf(invoice: Invoice, items: InvoiceItem[]): Promise<Buffer>;
}
