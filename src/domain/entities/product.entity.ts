export class Product {
  id: string;

  code: string;

  name: string;

  description?: string;

  unitPrice: number;

  availableQuantity: number;

  createdAt: Date;

  updatedAt: Date;

  deletedAt?: Date;

  constructor(partial: Partial<Product>) {
    Object.assign(this, partial);
  }
}
