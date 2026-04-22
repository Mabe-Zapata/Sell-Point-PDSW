import { DomainException } from './domain.exception';

/**
 * Exception thrown when attempting to create a customer with a duplicate cedula
 */
export class DuplicateCedulaException extends DomainException {
  constructor(cedula: string) {
    super(`Customer with cedula ${cedula} already exists`);
    this.name = 'DuplicateCedulaException';
  }
}
