import { Injectable } from '@nestjs/common';
import type { IUnitOfWork } from '../../unit-of-work/unit-of-work.interface';
import { Sale, StockMovement, StockMovementType } from '../../../domain/entities';
import { SaleConfirmedEvent } from '../../../domain/events/sale-confirmed.event';
import { InsufficientStockException, BusinessRuleException } from '../../../domain/exceptions';

@Injectable()
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
        // Find product with pessimistic lock for update
        const product = await this.uow.products.findByIdForUpdate(detail.productId);

        if (!product) {
          throw new BusinessRuleException(`Product ${detail.productId} not found`);
        }

        // Validate sufficient stock
        if (product.currentStock < detail.quantity) {
          throw new InsufficientStockException(
            detail.productName || 'Unknown',
            detail.quantity,
            product.currentStock,
          );
        }

        // Deduct stock
        const previousStock = product.currentStock;
        const newStock = previousStock - detail.quantity;
        product.currentStock = newStock;
        await this.uow.products.update(product);

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
      this.uow.dispatchEvent(new SaleConfirmedEvent(sale.id, new Date(), sale.total));
    } catch (error) {
      await this.uow.rollback();
      throw error;
    }
  }
}