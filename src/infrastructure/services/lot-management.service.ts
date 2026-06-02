import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CreateLotDto } from '../../application/dto/lot/create-lot.dto';
import { UpdateLotStockDto } from '../../application/dto/lot/update-lot-stock.dto';
import type { IUnitOfWork } from '../../application/unit-of-work/unit-of-work.interface';
import { Lot } from '../../domain/entities';
import { BusinessRuleException } from '../../domain/exceptions';
import { UNIT_OF_WORK } from '../common/injection-tokens';

@Injectable()
export class LotManagementService {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: IUnitOfWork,
  ) {}

  async create(dto: CreateLotDto): Promise<Lot> {
    await this.uow.start();
    try {
      const product = await this.uow.products.findByIdForUpdate(dto.productId);
      if (!product) {
        throw new BusinessRuleException(`Product ${dto.productId} not found`);
      }

      const quantityReceived = Number(dto.quantityReceived);
      const unitCost = Number(dto.unitCost);
      const receivedAt = new Date(dto.receivedAt);
      const expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : undefined;

      const lot = new Lot({
        id: randomUUID(),
        productId: product.id,
        lotCode: dto.lotCode.trim(),
        quantityReceived,
        quantityAvailable: quantityReceived,
        unitCost,
        estimatedUnitProfit: Number((product.salePrice - unitCost).toFixed(2)),
        receivedAt,
        expiresAt,
      });

      const saved = await this.uow.lots.create(lot);
      await this.uow.products.incrementStock(product.id, quantityReceived);
      await this.uow.commit();
      return saved;
    } catch (error) {
      await this.uow.rollback();
      throw error;
    }
  }

  async listByProduct(productId: string): Promise<Lot[]> {
    await this.uow.start();
    try {
      const lots = await this.uow.lots.findActiveByProductId(productId);
      await this.uow.commit();
      return lots;
    } catch (error) {
      await this.uow.rollback();
      throw error;
    }
  }

  async updateStock(id: string, dto: UpdateLotStockDto): Promise<Lot> {
    await this.uow.start();
    try {
      const lot = await this.uow.lots.findById(id);
      if (!lot || lot.isDeleted) {
        throw new BusinessRuleException(`Lot ${id} not found`);
      }

      const nextQuantity = Number(dto.quantityAvailable);
      if (Number.isNaN(nextQuantity) || nextQuantity < 0) {
        throw new BusinessRuleException('Lot available quantity cannot be negative');
      }

      const delta = Number((nextQuantity - lot.quantityAvailable).toFixed(3));
      if (delta > 0) {
        await this.uow.products.incrementStock(lot.productId, delta);
      } else if (delta < 0) {
        await this.uow.products.decrementStock(lot.productId, Math.abs(delta));
      }

      lot.quantityAvailable = nextQuantity;
      const updated = await this.uow.lots.update(lot);
      await this.uow.commit();
      return updated;
    } catch (error) {
      await this.uow.rollback();
      throw error;
    }
  }

  async softDelete(id: string): Promise<void> {
    await this.uow.start();
    try {
      const lot = await this.uow.lots.findById(id);
      if (!lot || lot.isDeleted) {
        throw new BusinessRuleException(`Lot ${id} not found`);
      }
      if (lot.quantityAvailable > 0) {
        throw new BusinessRuleException('Lot with available stock cannot be deleted');
      }
      await this.uow.lots.softDelete(id);
      await this.uow.commit();
    } catch (error) {
      await this.uow.rollback();
      throw error;
    }
  }
}
