export class Customer {
  id: string;

  name: string;

  lastName: string;

  cedula: string;

  email?: string;

  phone?: string;

  address?: string;

  createdAt: Date;

  updatedAt: Date;

  deletedAt?: Date;

  constructor(partial: Partial<Customer>) {
    Object.assign(this, partial);
  }
}
