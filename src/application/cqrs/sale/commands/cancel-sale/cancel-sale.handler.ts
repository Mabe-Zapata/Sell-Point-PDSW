import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { CancelSaleCommand } from './cancel-sale.command';
import { CancelSaleValidator } from './cancel-sale.validator';
import { SALE_REPOSITORY, SALE_DETAIL_REPOSITORY, INVENTORY_REPOSITORY, STOCK_MOVEMENT_REPOSITORY, WAREHOUSE_REPOSITORY } from '../../../../tokens';
import type { ISaleRepository, ISaleDetailRepository, IInventoryRepository, IStockMovementRepository, IWarehouseRepository } from '../../../../../domain/repositories';
import { SaleStatus, StockMovement, StockMovementType } from '../../../../../domain/entities';

@CommandHandler(CancelSaleCommand)
export class CancelSaleHandler implements ICommandHandler<CancelSaleCommand> {
  constructor(
    private readonly validator: CancelSaleValidator,
    @Inject(SALE_REPOSITORY) private readonly saleRepository: ISaleRepository,
    @Inject(SALE_DETAIL_REPOSITORY) private readonly saleDetailRepository: ISaleDetailRepository,
    @Inject(INVENTORY_REPOSITORY) private readonly inventoryRepository: IInventoryRepository,
    @Inject(STOCK_MOVEMENT_REPOSITORY) private readonly stockMovementRepository: IStockMovementRepository,
    @Inject(WAREHOUSE_REPOSITORY) private readonly warehouseRepository: IWarehouseRepository,
  ) {}

  async execute(command: CancelSaleCommand): Promise<void> {
    this.validator.validate(command.saleId);

    const sale = await this.saleRepository.findById(command.saleId);
    if (!sale) {
      throw new Error(`Sale with ID '${command.saleId}' not found`);
    }

    // Find main warehouse for the branch
    const mainWarehouse = await this.warehouseRepository.findMainByBranchId(sale.branchId);

    // Restore inventory per sale_details (only if warehouse exists)
    if (mainWarehouse) {
      const saleDetails = await this.saleDetailRepository.findBySaleId(command.saleId);
      for (const detail of saleDetails) {
        const inventory = await this.inventoryRepository.findByWarehouseAndProduct(
          mainWarehouse.id,
          detail.productId,
        );

        if (inventory) {
          const stockBefore = inventory.currentStock;
          const stockAfter = stockBefore + detail.quantity;

          // Create stock movement for ADJUSTMENT (return)
          const movement = new StockMovement({
            warehouseId: mainWarehouse.id,
            productId: detail.productId,
            type: StockMovementType.ADJUSTMENT,
            quantity: detail.quantity,
            stockBefore,
            stockAfter,
            referenceType: 'SALE_CANCEL',
            referenceId: sale.id,
            description: `Sale cancellation ${sale.saleNumber}`,
          });

          await this.stockMovementRepository.create(movement);

          // Restore inventory stock
          await this.inventoryRepository.updateStock(inventory.id, stockAfter);
        }
      }
    }

    const updated = { ...sale, status: SaleStatus.CANCELLED };
    await this.saleRepository.update(updated as any);
  }
}