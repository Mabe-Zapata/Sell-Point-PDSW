/**
 * Exception for business rule violations
 */
export class BusinessRuleException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BusinessRuleException';
    Error.captureStackTrace(this, this.constructor);
  }
}