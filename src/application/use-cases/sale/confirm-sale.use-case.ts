import type { IUnitOfWork } from '../../unit-of-work/unit-of-work.interface';
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

      // Validate each sale detail. Stock and lot consumption happen atomically when the invoice is issued.
      for (const detail of sale.details) {
        const product = await this.uow.products.findByIdForUpdate(detail.productId);

        if (!product) {
          throw new BusinessRuleException(`Product ${detail.productId} not found`);
        }

        if ((product.currentStock ?? 0) < detail.quantity) {
          throw new BusinessRuleException(
            `Insufficient stock for product ${product.name}. Available: ${product.currentStock ?? 0}, Requested: ${detail.quantity}`,
          );
        }
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
          undefined,
          sale.branchId,
        ),
      );
    } catch (error) {
      await this.uow.rollback();
      throw error;
    }
  }
}
