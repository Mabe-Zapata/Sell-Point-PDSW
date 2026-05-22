export class Inventory {
  id!: string;

  warehouseId!: string;

  productId!: string;

  currentStock!: number;

  minimumStock!: number;

  maximumStock!: number;

  updatedAt!: Date;

  constructor(partial: Partial<Inventory>) {
    Object.assign(this, partial);
  }
}
