import { StockMovement } from '../../../domain/entities/stock-movement.entity';
import { StockMovementType } from '../../../domain/entities/enums/stock-movement-type.enum';

export class StockMovementResponseDto {
  id: number;
  productId: string;
  type: StockMovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  description?: string;
  referenceType?: string;
  referenceId?: string;
  createdAt: Date;

  constructor(movement: StockMovement) {
    this.id = movement.id;
    this.productId = movement.productId;
    this.type = movement.type;
    this.quantity = movement.quantity;
    this.previousStock = movement.previousStock;
    this.newStock = movement.newStock;
    this.description = movement.description;
    this.referenceType = movement.referenceType;
    this.referenceId = movement.referenceId;
    this.createdAt = movement.createdAt;
  }

  static fromEntity(movement: StockMovement): StockMovementResponseDto {
    return new StockMovementResponseDto(movement);
  }
}
