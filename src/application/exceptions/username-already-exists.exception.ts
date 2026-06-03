import { DomainException } from '../../domain/exceptions';

export class UsernameAlreadyExistsException extends DomainException {
  constructor(username: string) {
    super(`The username ${username} is already registered in the system.`);
    this.name = 'UsernameAlreadyExistsException';
  }
}
