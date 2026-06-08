import { DomainException } from '../../domain/exceptions';

export class CedulaAlreadyExistsException extends DomainException {
  constructor(cedula: string) {
    super(`The cedula ${cedula} is already registered in the system.`);
    this.name = 'CedulaAlreadyExistsException';
  }
}
