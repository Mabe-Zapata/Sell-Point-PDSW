/**
 * Exception for business rule violations
 */
import { DomainException } from './domain.exception';

export class BusinessRuleException extends DomainException {
  constructor(message: string) {
    super(message);
    this.name = 'BusinessRuleException';
    Error.captureStackTrace(this, this.constructor);
  }
}
