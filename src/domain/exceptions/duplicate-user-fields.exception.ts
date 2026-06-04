import { DomainException } from './domain.exception';

export interface DuplicateUserFieldErrors {
  email?: string;
  username?: string;
  cedula?: string;
}

export class DuplicateUserFieldsException extends DomainException {
  constructor(public readonly errors: DuplicateUserFieldErrors) {
    super('One or more user fields are already registered');
    this.name = 'DuplicateUserFieldsException';
  }
}
