import { CancelInvoiceCommand } from './cancel-invoice.command';

export class CancelInvoiceValidator {
  static validate(command: CancelInvoiceCommand): void {
    if (!command.invoiceId || typeof command.invoiceId !== 'string') {
      throw new Error('invoiceId is required and must be a string');
    }
  }
}
