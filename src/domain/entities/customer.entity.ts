export class Customer {
  id!: string;

  names!: string;

  lastName?: string;

  cedula?: string;

  email?: string;

  phone?: string;

  address?: string;

  isActive!: boolean;

  createdAt!: Date;

  updatedAt!: Date;

  deletedAt?: Date;

  constructor(partial: Partial<Customer>) {
    Object.assign(this, partial);
  }
}