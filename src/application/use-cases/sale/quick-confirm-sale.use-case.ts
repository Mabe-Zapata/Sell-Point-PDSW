import * as crypto from 'crypto';
import type { IUnitOfWork } from '../../unit-of-work/unit-of-work.interface';
import type { ICategoryRepository } from '../../../domain/repositories/category.repository.interface';
import type { ITaxRateRepository } from '../../../domain/repositories/tax-rate.repository.interface';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import type { QuickConfirmSalePayload } from '../../cqrs/sale/commands/quick-confirm-sale/quick-confirm-sale.command';
import { SaleConfirmedEvent } from '../../../domain/events/sale-confirmed.event';
import { BusinessRuleException } from '../../../domain/exceptions';
import { StockMovement, StockMovementType } from '../../../domain/entities';

interface SaleDetailData {
  productId: string;
  productName: string;
  productCode: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  taxRateId: string;
  taxPercentage: number;
  taxAmount: number;
}

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
    private readonly categoryRepository: ICategoryRepository,
    private readonly taxRateRepository: ITaxRateRepository,
    private readonly userRepository: IUserRepository,
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
    }

    await this.uow.start();

    try {
      // Find user (cashier)
      const user = await this.userRepository.findById(payload.cashierUserId);
      if (!user) {
        throw new BusinessRuleException(`User with ID '${payload.cashierUserId}' not found`);
      }
      if (!user.defaultBranchId) {
        throw new BusinessRuleException('User has no default branch assigned');
      }

      const saleId = crypto.randomUUID();
      const saleNumber = await this.uow.sales.getNextSaleNumber();

      // Process sale details with per-line tax calculation
      let subtotal = 0;
      let totalTaxAmount = 0;
      const saleDetailsData: SaleDetailData[] = [];

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

        const unitPrice = Number(product.salePrice);

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

        // Resolve tax rate from product's category
        const category = await this.categoryRepository.findById(product.categoryId);
        if (!category) {
          throw new BusinessRuleException(`Category not found for product '${product.name}'`);
        }
        if (!category.taxRateId) {
          throw new BusinessRuleException(`Category '${category.name}' has no tax rate assigned`);
        }
        const taxRate = await this.taxRateRepository.findById(category.taxRateId);
        if (!taxRate) {
          throw new BusinessRuleException(`Tax rate not found for category '${category.name}'`);
        }

        const lineSubtotal = detail.quantity * unitPrice;
        const lineTaxAmount = Math.round(lineSubtotal * (Number(taxRate.percentage) / 100) * 100) / 100;
        subtotal += lineSubtotal;
        totalTaxAmount += lineTaxAmount;

        saleDetailsData.push({
          productId: detail.productId,
          productName: product.name,
          productCode: product.code,
          quantity: detail.quantity,
          unitPrice,
          subtotal: lineSubtotal,
          taxRateId: taxRate.id,
          taxPercentage: Number(taxRate.percentage),
          taxAmount: lineTaxAmount,
        });
      }

      const total = subtotal + totalTaxAmount;

      // Create sale (no taxRateId at sale level)
      const { Sale, SaleStatus } = await import('../../../domain/entities/index.js');
      const sale = new Sale({
        id: saleId,
        branchId: user.defaultBranchId,
        customerId: payload.customerId || null,
        cashierUserId: payload.cashierUserId,
        saleNumber,
        status: SaleStatus.CONFIRMED,
        subtotal,
        taxAmount: totalTaxAmount,
        discountAmount: 0,
        total,
      });

      await this.uow.sales.create(sale);

      // Create sale details with tax snapshot
      for (const detail of saleDetailsData) {
        const { SaleDetail } = await import('../../../domain/entities/index.js');
        await this.uow.saleDetails.create(new SaleDetail({
          saleId,
          productId: detail.productId,
          productName: detail.productName,
          productCode: detail.productCode,
          quantity: detail.quantity,
          unitPrice: detail.unitPrice,
          taxRateId: detail.taxRateId,
          taxPercentage: detail.taxPercentage,
          taxAmount: detail.taxAmount,
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
          undefined,
          user.defaultBranchId,
        ),
      );

      return {
        id: saleId,
        saleNumber,
        subtotal,
        taxAmount: totalTaxAmount,
        total,
        status: 'CONFIRMED',
      };
    } catch (error) {
      await this.uow.rollback();
      throw error;
    }
  }
}
