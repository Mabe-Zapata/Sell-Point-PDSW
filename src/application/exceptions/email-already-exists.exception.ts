import { DomainException } from '../../domain/exceptions';

export class EmailAlreadyExistsException extends DomainException {
  constructor(email: string) {
    super(`The email ${email} is already registered in the system.`);
    this.name = 'EmailAlreadyExistsException';
  }
}
