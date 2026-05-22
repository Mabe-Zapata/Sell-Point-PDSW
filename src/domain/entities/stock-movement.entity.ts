import { StockMovementType } from './enums';

export class StockMovement {
  id!: string;

  warehouseId!: string;

  productId!: string;

  type!: StockMovementType;

  quantity!: number;

  stockBefore!: number;

  stockAfter!: number;

  userId?: string;

  referenceType?: string;

  referenceId?: string;

  description?: string;

  createdAt!: Date;

  constructor(partial: Partial<StockMovement>) {
    Object.assign(this, partial);
  }
}
