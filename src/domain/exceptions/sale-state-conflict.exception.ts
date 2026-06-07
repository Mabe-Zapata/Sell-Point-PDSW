import { DomainException } from './domain.exception';

export class SaleStateConflictException extends DomainException {
  constructor(message: string) {
    super(message);
    this.name = 'SaleStateConflictException';
    Error.captureStackTrace(this, this.constructor);
  }
}
