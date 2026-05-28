import { CreateInvoiceCommand } from './create-invoice.command';

export class CreateInvoiceValidator {
  static validate(command: CreateInvoiceCommand): void {
    if (!command.saleId || typeof command.saleId !== 'string') {
      throw new Error('saleId is required and must be a string');
    }

    if (!command.branchId || typeof command.branchId !== 'string') {
      throw new Error('branchId is required and must be a string');
    }
  }
}
