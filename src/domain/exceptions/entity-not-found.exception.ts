import { DomainException } from './domain.exception';

/**
 * Exception thrown when an entity is not found
 */
export class EntityNotFoundException extends DomainException {
  constructor(entityName: string, id: string) {
    super(`${entityName} with id ${id} not found`);
    this.name = 'EntityNotFoundException';
  }
}
