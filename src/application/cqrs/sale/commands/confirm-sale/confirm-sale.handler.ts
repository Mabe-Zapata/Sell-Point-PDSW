import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ConfirmSaleCommand } from './confirm-sale.command';
import { ConfirmSaleValidator } from './confirm-sale.validator';
import { SALE_REPOSITORY } from '../../../../tokens';
import type { ISaleRepository } from '../../../../../domain/repositories';
import { SaleTypeOrmEntity } from '../../../../../infrastructure/database/entities/sale.typeorm.entity';
import { SaleDetailTypeOrmEntity } from '../../../../../infrastructure/database/entities/sale-detail.typeorm.entity';
import { ProductTypeOrmEntity } from '../../../../../infrastructure/database/entities/product.typeorm.entity';
import { StockMovementTypeOrmEntity } from '../../../../../infrastructure/database/entities/stock-movement.typeorm.entity';
import { SaleStatus, StockMovementType } from '../../../../../domain/entities';
import { BusinessRuleException } from '../../../../../domain/exceptions/business-rule.exception';
import { IdempotencyService } from '../../../../../infrastructure/services/idempotency.service';
import { ConflictException } from '@nestjs/common';

@CommandHandler(ConfirmSaleCommand)
export class ConfirmSaleHandler implements ICommandHandler<ConfirmSaleCommand> {
  constructor(
    private readonly validator: ConfirmSaleValidator,
    @Inject(SALE_REPOSITORY) private readonly saleRepository: ISaleRepository,
    private readonly dataSource: DataSource,
    private readonly idempotencyService: IdempotencyService,
  ) {}

  async execute(command: ConfirmSaleCommand): Promise<void> {
    this.validator.validate(command.saleId);

    // Idempotency check: si el key ya fue procesado, no ejecutar de nuevo
    if (command.idempotencyKey) {
      const { isDuplicate } = await this.idempotencyService.checkAndMark(command.idempotencyKey);
      if (isDuplicate) {
        return;
      }
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const sale = await queryRunner.manager
        .createQueryBuilder(SaleTypeOrmEntity, 'sale')
        .where('sale.id = :id', { id: command.saleId })
        .setLock('pessimistic_write')
        .getOne();

      if (!sale) {
        throw new Error(`Sale with ID '${command.saleId}' not found`);
      }

      const saleDetails = await queryRunner.manager
        .createQueryBuilder(SaleDetailTypeOrmEntity, 'sd')
        .where('sd.saleId = :saleId', { saleId: command.saleId })
        .getMany();

      for (const detail of saleDetails) {
        if (detail.quantity <= 0) {
          throw new BusinessRuleException('Sale detail quantity must be greater than 0');
        }
      }

      for (const detail of saleDetails) {
        const product = await queryRunner.manager
          .createQueryBuilder(ProductTypeOrmEntity, 'p')
          .where('p.id = :id', { id: detail.productId })
          .setLock('pessimistic_write')
          .getOne();

        if (!product) {
          throw new BusinessRuleException(`Product ${detail.productId} not found`);
        }

        const currentStock = product.currentStock ?? 0;
        if (currentStock < detail.quantity) {
          throw new ConflictException(
            `Insufficient stock for product ${detail.productNameSnapshot}. Available: ${currentStock}, Requested: ${detail.quantity}`,
          );
        }

        const previousStock = currentStock;
        const newStock = previousStock - detail.quantity;
        product.currentStock = newStock;
        await queryRunner.manager.save(product);

        const movement = queryRunner.manager.create(StockMovementTypeOrmEntity, {
          productId: detail.productId,
          type: StockMovementType.SALE,
          quantity: detail.quantity,
          previousStock,
          newStock,
          referenceType: 'SALE',
          referenceId: sale.id,
          description: `Sale ${sale.saleNumber}`,
        });
        await queryRunner.manager.save(movement);
      }

      sale.status = SaleStatus.CONFIRMED;
      await queryRunner.manager.save(sale);

      await queryRunner.commitTransaction();

      if (command.idempotencyKey) {
        await this.idempotencyService.saveResponse(command.idempotencyKey, { success: true, saleId: sale.id });
      }
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
