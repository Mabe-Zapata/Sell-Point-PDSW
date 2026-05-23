import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ConfirmSaleCommand } from './confirm-sale.command';
import { ConfirmSaleValidator } from './confirm-sale.validator';
import { SALE_REPOSITORY, SALE_DETAIL_REPOSITORY, STOCK_MOVEMENT_REPOSITORY, PRODUCT_REPOSITORY } from '../../../../tokens';
import type { ISaleRepository, ISaleDetailRepository, IStockMovementRepository, IProductRepository } from '../../../../../domain/repositories';
import { SaleStatus, StockMovement, StockMovementType } from '../../../../../domain/entities';
import { BusinessRuleException } from '../../../../../domain/exceptions/business-rule.exception';

@CommandHandler(ConfirmSaleCommand)
export class ConfirmSaleHandler implements ICommandHandler<ConfirmSaleCommand> {
  constructor(
    private readonly validator: ConfirmSaleValidator,
    @Inject(SALE_REPOSITORY) private readonly saleRepository: ISaleRepository,
    @Inject(SALE_DETAIL_REPOSITORY) private readonly saleDetailRepository: ISaleDetailRepository,
    @Inject(PRODUCT_REPOSITORY) private readonly productRepository: IProductRepository,
    @Inject(STOCK_MOVEMENT_REPOSITORY) private readonly stockMovementRepository: IStockMovementRepository,
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

    // R16: Stock cannot go negative - check stock levels before deducting
    for (const detail of saleDetails) {
      const product = await this.productRepository.findById(detail.productId);
      if (!product) {
        throw new BusinessRuleException(`Product ${detail.productId} not found`);
      }

      const currentStock = product.currentStock ?? 0;
      if (currentStock < detail.quantity) {
        throw new BusinessRuleException(`Insufficient stock for product ${detail.productName}. Available: ${currentStock}, Requested: ${detail.quantity}`);
      }
    }

    // Deduct stock per sale_details
    for (const detail of saleDetails) {
      const product = await this.productRepository.findById(detail.productId);
      if (product) {
        const previousStock = product.currentStock ?? 0;
        const newStock = previousStock - detail.quantity;

        // Create stock movement for SALE
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

        await this.stockMovementRepository.create(movement);

        // Update product stock
        product.currentStock = newStock;
        await this.productRepository.update(product);
      }
    }

    const updated = { ...sale, status: SaleStatus.CONFIRMED };
    await this.saleRepository.update(updated as any);
  }
}