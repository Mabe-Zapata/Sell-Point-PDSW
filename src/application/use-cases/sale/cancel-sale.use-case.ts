import type { IUnitOfWork } from '../../unit-of-work/unit-of-work.interface';
import { StockMovement, StockMovementType } from '../../../domain/entities';
import { SaleCancelledEvent } from '../../../domain/events/sale-cancelled.event';
import { BusinessRuleException } from '../../../domain/exceptions';

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
        // Find product with pessimistic lock to capture previousStock
        const product = await this.uow.products.findByIdForUpdate(detail.productId);

        if (product) {
          // Restore stock atomically
          const previousStock = product.currentStock;
          await this.uow.products.incrementStock(detail.productId, detail.quantity);
          const newStock = previousStock + detail.quantity;

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

      // Restore lot stock consumed in this sale
      const invoice = await this.uow.invoices.findBySaleId(saleId);
      if (invoice) {
        const consumedLots = await this.uow.invoiceItemLots.findByInvoiceId(invoice.id);
        if (consumedLots.length > 0) {
          // Group by lotId and sum quantities to restore
          const lotRestoreMap = new Map<string, number>();
          for (const cl of consumedLots) {
            const current = lotRestoreMap.get(cl.lotId) ?? 0;
            lotRestoreMap.set(cl.lotId, current + cl.quantityUsed);
          }

          // Restore each lot's quantityAvailable
          for (const [lotId, quantity] of lotRestoreMap) {
            const lot = await this.uow.lots.findById(lotId);
            if (lot) {
              const restored = Number((lot.quantityAvailable + quantity).toFixed(3));
              await this.uow.lots.setQuantityAvailable(lotId, restored);
            }
          }

          // Remove the lot consumption records
          await this.uow.invoiceItemLots.deleteByInvoiceId(invoice.id);
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
