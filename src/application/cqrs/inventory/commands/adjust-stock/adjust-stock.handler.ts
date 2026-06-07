import { AdjustStockCommand } from './adjust-stock.command';
import type { IProductRepository } from '../../../../../domain/repositories/product.repository.interface';
import type { IStockMovementRepository } from '../../../../../domain/repositories/stock-movement.repository.interface';
import { StockMovement } from '../../../../../domain/entities/stock-movement.entity';
import { StockMovementType } from '../../../../../domain/entities/enums/stock-movement-type.enum';
import { EntityNotFoundException } from '../../../../../domain/exceptions/entity-not-found.exception';
import { InsufficientStockException } from '../../../../../domain/exceptions/insufficient-stock.exception';

export class AdjustStockHandler {
  constructor(
    protected readonly productRepository: IProductRepository,
    protected readonly stockMovementRepository: IStockMovementRepository,
  ) {}

  async execute(command: AdjustStockCommand): Promise<StockMovement> {
    const product = await this.productRepository.findById(command.productId);
    if (!product) {
      throw new EntityNotFoundException('Product', command.productId);
    }

    const previousStock = product.currentStock;
    let delta: number;
    let movementType: StockMovementType;

    switch (command.dto.type) {
      case StockMovementType.IN:
        delta = command.dto.quantity;
        movementType = StockMovementType.IN;
        break;
      case StockMovementType.OUT:
        delta = -command.dto.quantity;
        movementType = StockMovementType.OUT;
        break;
      case StockMovementType.ADJUSTMENT:
        delta = command.dto.quantity;
        movementType = StockMovementType.ADJUSTMENT;
        break;
      default:
        delta = command.dto.quantity;
        movementType = StockMovementType.ADJUSTMENT;
    }

    // Reject if the resulting stock would be negative
    const newStock = previousStock + delta;
    if (newStock < 0) {
      throw new InsufficientStockException(
        product.name,
        Math.abs(delta),
        previousStock,
      );
    }

    if (delta >= 0) {
      await this.productRepository.incrementStock(command.productId, delta);
    } else {
      await this.productRepository.decrementStock(command.productId, -delta);
    }

    return this.stockMovementRepository.create(
      new StockMovement({
        productId: command.productId,
        type: movementType,
        quantity: Math.abs(delta),
        previousStock,
        newStock,
        description: command.dto.description,
        referenceType: command.dto.referenceType,
        referenceId: command.dto.referenceId,
      }),
    );
  }
}
