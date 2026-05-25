import { randomUUID } from 'crypto';
import { IUuidGenerator } from '../../application/ports/uuid-generator.interface';

export class UuidGenerator implements IUuidGenerator {
  generate(): string {
    return randomUUID();
  }
}
