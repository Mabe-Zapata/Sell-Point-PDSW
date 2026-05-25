import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CancelSaleCommand } from './cancel-sale.command';
import { CancelSaleValidator } from './cancel-sale.validator';
import { SALE_REPOSITORY } from '../../../../tokens';
import type { ISaleRepository } from '../../../../../domain/repositories';
import { SaleTypeOrmEntity } from '../../../../../infrastructure/database/entities/sale.typeorm.entity';
import { SaleDetailTypeOrmEntity } from '../../../../../infrastructure/database/entities/sale-detail.typeorm.entity';
import { ProductTypeOrmEntity } from '../../../../../infrastructure/database/entities/product.typeorm.entity';
import { StockMovementTypeOrmEntity } from '../../../../../infrastructure/database/entities/stock-movement.typeorm.entity';
import { BusinessRuleException } from '../../../../../domain/exceptions/business-rule.exception';
import { SaleStatus, StockMovementType } from '../../../../../domain/entities';

@CommandHandler(CancelSaleCommand)
export class CancelSaleHandler implements ICommandHandler<CancelSaleCommand> {
  constructor(
    private readonly validator: CancelSaleValidator,
    @Inject(SALE_REPOSITORY) private readonly saleRepository: ISaleRepository,
    private readonly dataSource: DataSource,
  ) {}

  async execute(command: CancelSaleCommand): Promise<void> {
    this.validator.validate(command.saleId);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Read sale with lock
      const sale = await queryRunner.manager
        .createQueryBuilder(SaleTypeOrmEntity, 'sale')
        .where('sale.id = :id', { id: command.saleId })
        .setLock('pessimistic_write')
        .getOne();

      if (!sale) {
        throw new BusinessRuleException(`Sale with ID '${command.saleId}' not found`);
      }

      if (sale.status === SaleStatus.CANCELLED) {
        throw new BusinessRuleException(`Sale '${sale.saleNumber}' is already cancelled`);
      }

      // Read sale details
      const saleDetails = await queryRunner.manager
        .createQueryBuilder(SaleDetailTypeOrmEntity, 'sd')
        .where('sd.saleId = :saleId', { saleId: command.saleId })
        .getMany();

      // Restore stock per sale details
      for (const detail of saleDetails) {
        const product = await queryRunner.manager
          .createQueryBuilder(ProductTypeOrmEntity, 'p')
          .where('p.id = :id', { id: detail.productId })
          .setLock('pessimistic_write')
          .getOne();

        if (product) {
          const previousStock = product.currentStock ?? 0;
          const newStock = previousStock + detail.quantity;

          // Create stock movement for ADJUSTMENT (return)
          const movement = queryRunner.manager.create(StockMovementTypeOrmEntity, {
            productId: detail.productId,
            type: StockMovementType.ADJUSTMENT,
            quantity: detail.quantity,
            previousStock,
            newStock,
            referenceType: 'SALE_CANCEL',
            referenceId: sale.id,
            description: `Sale cancellation ${sale.saleNumber}`,
          });
          await queryRunner.manager.save(movement);

          // Restore product stock
          product.currentStock = newStock;
          await queryRunner.manager.save(product);
        }
      }

      // Update sale status
      sale.status = SaleStatus.CANCELLED;
      await queryRunner.manager.save(sale);

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}