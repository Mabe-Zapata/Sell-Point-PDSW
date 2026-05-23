import { StockMovementType } from './enums';

export class StockMovement {
  id!: string;

  productId!: string;

  type!: StockMovementType;

  quantity!: number;

  previousStock!: number;

  newStock!: number;

  userId?: string;

  referenceType?: string;

  referenceId?: string;

  description?: string;

  createdAt!: Date;

  constructor(partial: Partial<StockMovement>) {
    Object.assign(this, partial);
  }
}
