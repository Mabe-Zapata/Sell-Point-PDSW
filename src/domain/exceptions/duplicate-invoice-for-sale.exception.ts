import { DomainException } from './domain.exception';

export class DuplicateInvoiceForSaleException extends DomainException {
  constructor(saleId: string) {
    super(`Invoice already exists for sale ${saleId}`);
    this.name = 'DuplicateInvoiceForSaleException';
    Error.captureStackTrace(this, this.constructor);
  }
}
