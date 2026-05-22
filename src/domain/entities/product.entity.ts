export class Product {
  id!: string;

  // Legacy compatibility fields used by application/presentation layer
  unitPrice?: number;

  availableQuantity?: number;

  currentStock?: number;

  categoryId!: string;

  code!: string;

  name!: string;

  description?: string;

  salePrice!: number;

  costPrice!: number;

  isActive!: boolean;

  createdAt!: Date;

  updatedAt!: Date;

  deletedAt?: Date;

  constructor(partial: Partial<Product>) {
    Object.assign(this, partial);
  }
}
