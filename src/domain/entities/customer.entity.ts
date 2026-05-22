import { IdentificationType } from './enums';

export class Customer {
  id!: string;

  // Legacy compatibility fields used by application/presentation layer
  name?: string;

  lastName?: string;

  cedula?: string;

  identificationType!: IdentificationType;

  identificationNumber!: string;

  names!: string;

  email?: string;

  phone?: string;

  address?: string;

  createdAt!: Date;

  updatedAt!: Date;

  deletedAt?: Date;

  constructor(partial: Partial<Customer>) {
    Object.assign(this, partial);
  }
}
