import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ConfirmSaleCommand } from './confirm-sale.command';
import { ConfirmSaleValidator } from './confirm-sale.validator';
import { SALE_REPOSITORY, SALE_DETAIL_REPOSITORY, INVENTORY_REPOSITORY, STOCK_MOVEMENT_REPOSITORY, WAREHOUSE_REPOSITORY } from '../../../../tokens';
import type { ISaleRepository, ISaleDetailRepository, IInventoryRepository, IStockMovementRepository, IWarehouseRepository } from '../../../../../domain/repositories';
import { SaleStatus, StockMovement, StockMovementType } from '../../../../../domain/entities';
import { BusinessRuleException } from '../../../../../domain/exceptions/business-rule.exception';

@CommandHandler(ConfirmSaleCommand)
export class ConfirmSaleHandler implements ICommandHandler<ConfirmSaleCommand> {
  constructor(
    private readonly validator: ConfirmSaleValidator,
    @Inject(SALE_REPOSITORY) private readonly saleRepository: ISaleRepository,
    @Inject(SALE_DETAIL_REPOSITORY) private readonly saleDetailRepository: ISaleDetailRepository,
    @Inject(INVENTORY_REPOSITORY) private readonly inventoryRepository: IInventoryRepository,
    @Inject(STOCK_MOVEMENT_REPOSITORY) private readonly stockMovementRepository: IStockMovementRepository,
    @Inject(WAREHOUSE_REPOSITORY) private readonly warehouseRepository: IWarehouseRepository,
  ) {}

  async execute(command: ConfirmSaleCommand): Promise<void> {
    this.validator.validate(command.saleId);

    const sale = await this.saleRepository.findById(command.saleId);
    if (!sale) {
      throw new Error(`Sale with ID '${command.saleId}' not found`);
    }

    // R17: Positive quantity required - check all quantities before processing
    const saleDetails = await this.saleDetailRepository.findBySaleId(command.saleId);
    for (const detail of saleDetails) {
      if (detail.quantity <= 0) {
        throw new BusinessRuleException('Sale detail quantity must be greater than 0');
      }
    }

    // Find main warehouse for the branch
    const mainWarehouse = await this.warehouseRepository.findMainByBranchId(sale.branchId);
    if (!mainWarehouse) {
      throw new Error(`No main warehouse found for branch '${sale.branchId}'`);
    }

    // R16: Stock cannot go negative - check stock levels before deducting
    for (const detail of saleDetails) {
      const inventory = await this.inventoryRepository.findByWarehouseAndProduct(
        mainWarehouse.id,
        detail.productId,
      );

      if (inventory && inventory.currentStock < detail.quantity) {
        throw new BusinessRuleException(`Insufficient stock for product ${detail.productName}. Available: ${inventory.currentStock}, Requested: ${detail.quantity}`);
      }
    }

    // Deduct inventory per sale_details
    for (const detail of saleDetails) {
      const inventory = await this.inventoryRepository.findByWarehouseAndProduct(
        mainWarehouse.id,
        detail.productId,
      );

      if (inventory) {
        const stockBefore = inventory.currentStock;
        const stockAfter = stockBefore - detail.quantity;

        // Create stock movement for SALE
        const movement = new StockMovement({
          warehouseId: mainWarehouse.id,
          productId: detail.productId,
          type: StockMovementType.SALE,
          quantity: detail.quantity,
          stockBefore,
          stockAfter,
          referenceType: 'SALE',
          referenceId: sale.id,
          description: `Sale ${sale.saleNumber}`,
        });

        await this.stockMovementRepository.create(movement);

        // Update inventory stock
        await this.inventoryRepository.updateStock(inventory.id, stockAfter);
      }
    }

    const updated = { ...sale, status: SaleStatus.CONFIRMED };
    await this.saleRepository.update(updated as any);
  }
}