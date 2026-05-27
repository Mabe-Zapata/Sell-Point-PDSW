import { v4 as uuidv4 } from 'uuid';
import type { IUnitOfWork } from '../../unit-of-work/unit-of-work.interface';
import type { ITaxRateRepository } from '../../../domain/repositories/tax-rate.repository.interface';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import type { IInvoiceSeriesRepository } from '../../../domain/repositories/invoice-series.repository.interface';
import type { QuickConfirmSalePayload } from '../../cqrs/sale/commands/quick-confirm-sale/quick-confirm-sale.command';
import { SaleConfirmedEvent } from '../../../domain/events/sale-confirmed.event';
import { BusinessRuleException } from '../../../domain/exceptions';
import { StockMovement, StockMovementType } from '../../../domain/entities';

export interface QuickConfirmSaleResult {
  id: string;
  saleNumber: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  status: string;
}

export class QuickConfirmSaleUseCase {
  constructor(
    private readonly uow: IUnitOfWork,
    private readonly taxRateRepository: ITaxRateRepository,
    private readonly userRepository: IUserRepository,
    private readonly invoiceSeriesRepository: IInvoiceSeriesRepository,
  ) {}

  async execute(payload: QuickConfirmSalePayload): Promise<QuickConfirmSaleResult> {
    // Validate
    if (!payload.details || payload.details.length === 0) {
      throw new Error('At least one detail is required');
    }
    for (const detail of payload.details) {
      if (!detail.productId) {
        throw new Error('Product ID is required for each detail');
      }
      if (detail.quantity <= 0) {
        throw new Error('Quantity must be greater than 0');
      }
      if (detail.unitPrice < 0) {
        throw new Error('Unit price must be non-negative');
      }
    }

    await this.uow.start();

    try {
      // Find active tax rate
      const taxRateResult = await this.taxRateRepository.findAll({ page: 1, limit: 1 }, { isActive: true });
      const taxRate = taxRateResult.data[0];
      if (!taxRate) {
        throw new BusinessRuleException('No active tax rate found. Configure at least one tax rate.');
      }

      // Find user (cashier)
      const user = await this.userRepository.findById(payload.cashierUserId);
      if (!user) {
        throw new BusinessRuleException(`User with ID '${payload.cashierUserId}' not found`);
      }
      if (!user.defaultBranchId) {
        throw new BusinessRuleException('User has no default branch assigned');
      }

      // Find invoice series for branch with pessimistic lock
      const invoiceSeries = await this.invoiceSeriesRepository.findActiveByBranchId(user.defaultBranchId);
      if (!invoiceSeries) {
        throw new BusinessRuleException(
          `No active invoice series found for branch ${user.defaultBranchId}. Configure one first.`,
        );
      }

      // Increment sequence
      invoiceSeries.currentSequence += 1;
      await this.invoiceSeriesRepository.update(invoiceSeries);

      // Generate sale number
      const paddedSeq = String(invoiceSeries.currentSequence).padStart(9, '0');
      const saleNumber = `${invoiceSeries.establishmentCode}-${invoiceSeries.emissionPointCode}-${paddedSeq}`;
      const saleId = uuidv4();

      // Process sale details
      let subtotal = 0;
      const saleDetailsData: Array<{
        productId: string;
        productName: string;
        productCode: string;
        quantity: number;
        unitPrice: number;
        subtotal: number;
      }> = [];

      for (const detail of payload.details) {
        const product = await this.uow.products.findByIdForUpdate(detail.productId);

        if (!product) {
          throw new BusinessRuleException(`Product with ID '${detail.productId}' not found`);
        }

        const currentStock = product.currentStock ?? 0;
        if (currentStock < detail.quantity) {
          throw new BusinessRuleException(
            `Insufficient stock for product ${product.name}. Available: ${currentStock}, Requested: ${detail.quantity}`,
          );
        }

        // Deduct stock
        const previousStock = currentStock;
        await this.uow.products.decrementStock(detail.productId, detail.quantity);
        const newStock = previousStock - detail.quantity;

        // Create stock movement
        await this.uow.stockMovements.create(new StockMovement({
          productId: detail.productId,
          type: StockMovementType.SALE,
          quantity: detail.quantity,
          previousStock,
          newStock,
          userId: payload.cashierUserId,
          referenceType: 'SALE',
          referenceId: saleId,
          description: `Sale ${saleNumber}`,
        }));

        const lineSubtotal = detail.quantity * detail.unitPrice;
        subtotal += lineSubtotal;

        saleDetailsData.push({
          productId: detail.productId,
          productName: product.name,
          productCode: product.code,
          quantity: detail.quantity,
          unitPrice: detail.unitPrice,
          subtotal: lineSubtotal,
        });
      }

      // Calculate tax and total
      const taxAmount = Math.round(subtotal * (Number(taxRate.percentage) / 100) * 100) / 100;
      const total = subtotal + taxAmount;

      // Create sale
      const { Sale, SaleStatus } = await import('../../../domain/entities/index.js');
      const sale = new Sale({
        id: saleId,
        branchId: user.defaultBranchId,
        customerId: payload.customerId || null,
        cashierUserId: payload.cashierUserId,
        taxRateId: taxRate.id,
        saleNumber,
        status: SaleStatus.CONFIRMED,
        subtotal,
        taxAmount,
        discountAmount: 0,
        total,
      });

      await this.uow.sales.create(sale);

      // Create sale details
      for (const detail of saleDetailsData) {
        const { SaleDetail } = await import('../../../domain/entities/index.js');
        await this.uow.saleDetails.create(new SaleDetail({
          saleId,
          productId: detail.productId,
          productName: detail.productName,
          productCode: detail.productCode,
          quantity: detail.quantity,
          unitPrice: detail.unitPrice,
        }));
      }

      // Commit transaction
      await this.uow.commit();

      // Dispatch event after successful commit
      this.uow.dispatchEvent(
        new SaleConfirmedEvent(
          saleId,
          new Date(),
          total,
          'unknown@customer.com',
          'Customer',
          saleDetailsData.map((d) => ({
            productId: d.productId,
            productName: d.productName,
            quantity: d.quantity,
            unitPrice: d.unitPrice,
            subtotal: d.subtotal,
          })),
        ),
      );

      return {
        id: saleId,
        saleNumber,
        subtotal,
        taxAmount,
        total,
        status: 'CONFIRMED',
      };
    } catch (error) {
      await this.uow.rollback();
      throw error;
    }
  }
}