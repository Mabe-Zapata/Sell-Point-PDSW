import type { IUnitOfWork } from '../../unit-of-work/unit-of-work.interface';
import { StockMovement, StockMovementType } from '../../../domain/entities';
import { SaleConfirmedEvent } from '../../../domain/events/sale-confirmed.event';
import { BusinessRuleException } from '../../../domain/exceptions';

export class ConfirmSaleUseCase {
  constructor(private readonly uow: IUnitOfWork) {}

  async execute(saleId: string): Promise<void> {
    await this.uow.start();

    try {
      // Find sale with details using pessimistic lock
      const sale = await this.uow.sales.findByIdWithDetails(saleId);

      if (!sale) {
        throw new BusinessRuleException(`Sale with ID '${saleId}' not found`);
      }

      // Confirm the sale (validates it's in DRAFT status)
      sale.confirm();

      // Process each sale detail
      for (const detail of sale.details) {
        // Find product with pessimistic lock to capture previousStock
        const product = await this.uow.products.findByIdForUpdate(detail.productId);

        if (!product) {
          throw new BusinessRuleException(`Product ${detail.productId} not found`);
        }

        // Deduct stock atomically (decrementStock validates CUR_STO_PRO >= qty)
        const previousStock = product.currentStock;
        await this.uow.products.decrementStock(detail.productId, detail.quantity);
        const newStock = previousStock - detail.quantity;

        // Create stock movement record
        const movement = new StockMovement({
          productId: detail.productId,
          type: StockMovementType.SALE,
          quantity: detail.quantity,
          previousStock,
          newStock,
          referenceType: 'SALE',
          referenceId: sale.id,
          description: `Sale ${sale.saleNumber}`,
        });
        await this.uow.stockMovements.create(movement);
      }

      // Update sale status
      await this.uow.sales.update(sale);

      // Commit transaction
      await this.uow.commit();

      // Dispatch event after successful commit
      this.uow.dispatchEvent(
        new SaleConfirmedEvent(
          sale.id,
          new Date(),
          sale.total,
          sale.customerEmail ?? 'unknown@customer.com',
          sale.customerName ?? 'Customer',
          sale.details.map((d) => ({
            productId: d.productId,
            productName: d.productName,
            quantity: d.quantity,
            unitPrice: d.unitPrice,
            subtotal: d.unitPrice * d.quantity,
          })),
        ),
      );
    } catch (error) {
      await this.uow.rollback();
      throw error;
    }
  }
}
