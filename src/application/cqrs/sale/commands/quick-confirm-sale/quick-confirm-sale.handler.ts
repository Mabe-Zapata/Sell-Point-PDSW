import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { QuickConfirmSaleCommand } from './quick-confirm-sale.command';
import { QuickConfirmSaleValidator } from './quick-confirm-sale.validator';
import { SALE_REPOSITORY, SALE_DETAIL_REPOSITORY } from '../../../../tokens';
import type { ISaleRepository, ISaleDetailRepository } from '../../../../../domain/repositories';
import { SaleTypeOrmEntity } from '../../../../../infrastructure/database/entities/sale.typeorm.entity';
import { SaleDetailTypeOrmEntity } from '../../../../../infrastructure/database/entities/sale-detail.typeorm.entity';
import { ProductTypeOrmEntity } from '../../../../../infrastructure/database/entities/product.typeorm.entity';
import { TaxRateTypeOrmEntity } from '../../../../../infrastructure/database/entities/tax-rate.typeorm.entity';
import { UserTypeOrmEntity } from '../../../../../infrastructure/database/entities/user.typeorm.entity';
import { StockMovementTypeOrmEntity } from '../../../../../infrastructure/database/entities/stock-movement.typeorm.entity';
import { SaleStatus, StockMovementType } from '../../../../../domain/entities';
import { BusinessRuleException } from '../../../../../domain/exceptions/business-rule.exception';
import { IdempotencyService } from '../../../../../infrastructure/services/idempotency.service';
import { ConflictException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

@CommandHandler(QuickConfirmSaleCommand)
export class QuickConfirmSaleHandler implements ICommandHandler<QuickConfirmSaleCommand> {
  constructor(
    private readonly validator: QuickConfirmSaleValidator,
    @Inject(SALE_REPOSITORY) private readonly saleRepository: ISaleRepository,
    @Inject(SALE_DETAIL_REPOSITORY) private readonly saleDetailRepository: ISaleDetailRepository,
    private readonly dataSource: DataSource,
    private readonly idempotencyService: IdempotencyService,
  ) {}

  async execute(command: QuickConfirmSaleCommand): Promise<{
    id: string;
    saleNumber: string;
    subtotal: number;
    taxAmount: number;
    total: number;
    status: string;
  }> {
    const { payload } = command;
    this.validator.validate(payload);

    if (payload.idempotencyKey) {
      const { isDuplicate, previousResponse } = await this.idempotencyService.checkAndMark(payload.idempotencyKey);
      if (isDuplicate) {
        return previousResponse as {
          id: string; saleNumber: string; subtotal: number;
          taxAmount: number; total: number; status: string;
        };
      }
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const taxRate = await queryRunner.manager
        .createQueryBuilder(TaxRateTypeOrmEntity, 'tr')
        .where('tr.isActive = :active', { active: true })
        .orderBy('tr.createdAt', 'ASC')
        .getOne();

      if (!taxRate) {
        throw new BusinessRuleException('No active tax rate found. Configure at least one tax rate.');
      }

      const user = await queryRunner.manager
        .createQueryBuilder(UserTypeOrmEntity, 'u')
        .where('u.id = :id', { id: payload.cashierUserId })
        .getOne();

      if (!user) {
        throw new BusinessRuleException(`User with ID '${payload.cashierUserId}' not found`);
      }

      if (!user.defaultBranchId) {
        throw new BusinessRuleException('User has no default branch assigned');
      }

      const saleId = uuidv4();
      const saleNumber = `SAL-${Date.now()}-${uuidv4().slice(0, 8).toUpperCase()}`;
      const customerId = payload.customerId || 'guest';

      let subtotal = 0;
      let detailIndex = 0;

      for (const detail of payload.details) {
        detailIndex++;
        const product = await queryRunner.manager
          .createQueryBuilder(ProductTypeOrmEntity, 'p')
          .where('p.id = :id', { id: detail.productId })
          .setLock('pessimistic_write')
          .getOne();

        if (!product) {
          throw new BusinessRuleException(`Product with ID '${detail.productId}' not found`);
        }

        const currentStock = product.currentStock ?? 0;
        if (currentStock < detail.quantity) {
          throw new ConflictException(
            `Insufficient stock for product ${product.name}. Available: ${currentStock}, Requested: ${detail.quantity}`,
          );
        }

        const lineSubtotal = detail.quantity * detail.unitPrice;
        subtotal += lineSubtotal;

        const previousStock = currentStock;
        const newStock = previousStock - detail.quantity;
        product.currentStock = newStock;
        await queryRunner.manager.save(product);

        const now = Date.now();
        await queryRunner.manager.save(queryRunner.manager.create(SaleDetailTypeOrmEntity, {
          id: now + detailIndex,
          saleId,
          productId: detail.productId,
          productNameSnapshot: product.name,
          productCodeSnapshot: product.code,
          quantity: detail.quantity,
          unitPrice: detail.unitPrice,
        }));

        await queryRunner.manager.save(queryRunner.manager.create(StockMovementTypeOrmEntity, {
          id: now + detailIndex + 1000,
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
      }

      const taxAmount = Math.round(subtotal * (Number(taxRate.percentage) / 100) * 100) / 100;
      const total = subtotal + taxAmount;

      await queryRunner.manager.save(queryRunner.manager.create(SaleTypeOrmEntity, {
        id: saleId,
        branchId: user.defaultBranchId,
        customerId,
        cashierUserId: payload.cashierUserId,
        taxRateId: taxRate.id,
        saleNumber,
        status: SaleStatus.CONFIRMED,
        subtotal,
        taxAmount,
        discountAmount: 0,
        total,
      }));

      await queryRunner.commitTransaction();

      const result = { id: saleId, saleNumber, subtotal, taxAmount, total, status: SaleStatus.CONFIRMED };

      if (payload.idempotencyKey) {
        await this.idempotencyService.saveResponse(payload.idempotencyKey, result);
      }

      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
