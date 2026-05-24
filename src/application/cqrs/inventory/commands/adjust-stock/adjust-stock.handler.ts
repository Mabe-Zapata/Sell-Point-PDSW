import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { AdjustStockCommand } from './adjust-stock.command';
import { AdjustStockValidator } from './adjust-stock.validator';
import { PRODUCT_REPOSITORY, STOCK_MOVEMENT_REPOSITORY } from '../../../../tokens';
import type { IProductRepository } from '../../../../../domain/repositories/product.repository.interface';
import type { IStockMovementRepository } from '../../../../../domain/repositories/stock-movement.repository.interface';
import { Product } from '../../../../../domain/entities/product.entity';
import { StockMovement } from '../../../../../domain/entities/stock-movement.entity';
import { StockMovementType } from '../../../../../domain/entities/enums/stock-movement-type.enum';
import { EntityNotFoundException } from '../../../../../domain/exceptions/entity-not-found.exception';

@CommandHandler(AdjustStockCommand)
export class AdjustStockHandler implements ICommandHandler<AdjustStockCommand> {
  constructor(
    private readonly validator: AdjustStockValidator,
    @Inject(PRODUCT_REPOSITORY) private readonly productRepository: IProductRepository,
    @Inject(STOCK_MOVEMENT_REPOSITORY) private readonly stockMovementRepository: IStockMovementRepository,
  ) {}

  async execute(command: AdjustStockCommand): Promise<StockMovement> {
    this.validator.validate(command.dto);

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

    // Atomic stock mutation
    if (delta >= 0) {
      await this.productRepository.incrementStock(command.productId, delta);
    } else {
      await this.productRepository.decrementStock(command.productId, -delta);
    }

    const newStock = previousStock + delta;

    // Create movement record
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
