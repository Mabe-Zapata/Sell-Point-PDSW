import { Injectable } from '@nestjs/common';
import type { IUnitOfWork } from '../../unit-of-work/unit-of-work.interface';
import { Sale, StockMovement, StockMovementType } from '../../../domain/entities';
import { SaleCancelledEvent } from '../../../domain/events/sale-cancelled.event';
import { BusinessRuleException } from '../../../domain/exceptions';

@Injectable()
export class CancelSaleUseCase {
  constructor(private readonly uow: IUnitOfWork) {}

  async execute(saleId: string): Promise<void> {
    await this.uow.start();

    try {
      // Find sale with details using pessimistic lock
      const sale = await this.uow.sales.findByIdWithDetails(saleId);

      if (!sale) {
        throw new BusinessRuleException(`Sale with ID '${saleId}' not found`);
      }

      // Process each sale detail to restore stock
      for (const detail of sale.details) {
        // Find product with pessimistic lock for update
        const product = await this.uow.products.findByIdForUpdate(detail.productId);

        if (product) {
          // Restore stock
          const previousStock = product.currentStock;
          const newStock = previousStock + detail.quantity;
          product.currentStock = newStock;
          await this.uow.products.update(product);

          // Create stock movement for ADJUSTMENT (return)
          const movement = new StockMovement({
            productId: detail.productId,
            type: StockMovementType.ADJUSTMENT,
            quantity: detail.quantity,
            previousStock,
            newStock,
            referenceType: 'SALE_CANCEL',
            referenceId: sale.id,
            description: `Sale cancellation ${sale.saleNumber}`,
          });
          await this.uow.stockMovements.create(movement);
        }
      }

      // Cancel the sale (validates it's in CONFIRMED status)
      sale.cancel();

      // Update sale status
      await this.uow.sales.update(sale);

      // Commit transaction
      await this.uow.commit();

      // Dispatch event after successful commit
      this.uow.dispatchEvent(new SaleCancelledEvent(sale.id, new Date()));
    } catch (error) {
      await this.uow.rollback();
      throw error;
    }
  }
}