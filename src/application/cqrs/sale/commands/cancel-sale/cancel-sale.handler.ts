import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { CancelSaleCommand } from './cancel-sale.command';
import { CancelSaleValidator } from './cancel-sale.validator';
import { SALE_REPOSITORY, SALE_DETAIL_REPOSITORY, STOCK_MOVEMENT_REPOSITORY, PRODUCT_REPOSITORY } from '../../../../tokens';
import type { ISaleRepository, ISaleDetailRepository, IStockMovementRepository, IProductRepository } from '../../../../../domain/repositories';
import { SaleStatus, StockMovement, StockMovementType } from '../../../../../domain/entities';

@CommandHandler(CancelSaleCommand)
export class CancelSaleHandler implements ICommandHandler<CancelSaleCommand> {
  constructor(
    private readonly validator: CancelSaleValidator,
    @Inject(SALE_REPOSITORY) private readonly saleRepository: ISaleRepository,
    @Inject(SALE_DETAIL_REPOSITORY) private readonly saleDetailRepository: ISaleDetailRepository,
    @Inject(PRODUCT_REPOSITORY) private readonly productRepository: IProductRepository,
    @Inject(STOCK_MOVEMENT_REPOSITORY) private readonly stockMovementRepository: IStockMovementRepository,
  ) {}

  async execute(command: CancelSaleCommand): Promise<void> {
    this.validator.validate(command.saleId);

    const sale = await this.saleRepository.findById(command.saleId);
    if (!sale) {
      throw new Error(`Sale with ID '${command.saleId}' not found`);
    }

    // Restore stock per sale_details
    const saleDetails = await this.saleDetailRepository.findBySaleId(command.saleId);
    for (const detail of saleDetails) {
      const product = await this.productRepository.findById(detail.productId);
      if (product) {
        const previousStock = product.currentStock ?? 0;
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

        await this.stockMovementRepository.create(movement);

        // Restore product stock
        product.currentStock = newStock;
        await this.productRepository.update(product);
      }
    }

    const updated = { ...sale, status: SaleStatus.CANCELLED };
    await this.saleRepository.update(updated as any);
  }
}