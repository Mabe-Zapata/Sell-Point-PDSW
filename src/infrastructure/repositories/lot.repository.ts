import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Lot } from '../../domain/entities';
import type { ILotRepository } from '../../domain/repositories';
import { LotTypeOrmEntity } from '../database/entities/lot.typeorm.entity';

@Injectable()
export class LotRepository implements ILotRepository {
  constructor(
    @InjectRepository(LotTypeOrmEntity)
    private readonly repo: Repository<LotTypeOrmEntity>,
  ) {}

  async create(lot: Lot): Promise<Lot> {
    const saved = await this.repo.save(this.repo.create(this.mapToEntity(lot)));
    return this.mapToDomain(saved);
  }

  async findById(id: string): Promise<Lot | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? this.mapToDomain(entity) : null;
  }

  async findActiveByProductId(productId: string): Promise<Lot[]> {
    const entities = await this.repo.find({
      where: { productId, deletedAt: IsNull() },
      order: { receivedAt: 'ASC', createdAt: 'ASC' },
    });
    return entities.map((entity) => this.mapToDomain(entity));
  }

  async findActiveByProductIdForUpdate(productId: string): Promise<Lot[]> {
    return this.findActiveByProductId(productId);
  }

  async update(lot: Lot): Promise<Lot> {
    await this.repo.update(lot.id, this.mapToEntity(lot));
    const updated = await this.repo.findOne({ where: { id: lot.id } });
    if (!updated) throw new Error('Lot not found after update');
    return this.mapToDomain(updated);
  }

  async setQuantityAvailable(id: string, quantityAvailable: number): Promise<void> {
    await this.repo.update(id, { quantityAvailable });
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }

  async recalculateEstimatedProfit(productId: string, salePrice: number): Promise<void> {
    await this.repo
      .createQueryBuilder()
      .update(LotTypeOrmEntity)
      .set({ estimatedUnitProfit: () => `${salePrice} - "COS_UNI_LOT"` })
      .where('"PRO_ID" = :productId', { productId })
      .andWhere('"DEL_AT" IS NULL')
      .execute();
  }

  private mapToDomain(entity: LotTypeOrmEntity): Lot {
    return new Lot({
      id: String(entity.id),
      productId: entity.productId,
      lotCode: entity.lotCode,
      quantityReceived: Number(entity.quantityReceived),
      quantityAvailable: Number(entity.quantityAvailable),
      unitCost: Number(entity.unitCost),
      estimatedUnitProfit: Number(entity.estimatedUnitProfit),
      receivedAt: entity.receivedAt,
      expiresAt: entity.expiresAt,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt,
    });
  }

  private mapToEntity(lot: Lot): Partial<LotTypeOrmEntity> {
    return {
      id: lot.id,
      productId: lot.productId,
      lotCode: lot.lotCode,
      quantityReceived: lot.quantityReceived,
      quantityAvailable: lot.quantityAvailable,
      unitCost: lot.unitCost,
      estimatedUnitProfit: lot.estimatedUnitProfit,
      receivedAt: lot.receivedAt,
      expiresAt: lot.expiresAt,
    };
  }
}
