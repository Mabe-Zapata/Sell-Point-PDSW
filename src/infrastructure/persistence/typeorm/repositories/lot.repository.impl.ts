/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { QueryRunner } from 'typeorm';
import { Lot } from '../../../../domain/entities';
import type { ILotRepository } from '../../../../domain/repositories';

export class LotRepositoryImpl implements ILotRepository {
  constructor(private readonly qr: QueryRunner) {}

  async create(lot: Lot): Promise<Lot> {
    const entity = this.qr.manager.create('LotTypeOrmEntity', this.mapToEntity(lot));
    const saved = await this.qr.manager.save('LotTypeOrmEntity', entity);
    return this.mapToDomain(saved);
  }

  async findById(id: string): Promise<Lot | null> {
    const entity = await this.qr.manager.findOne('LotTypeOrmEntity', { where: { id } });
    return entity ? this.mapToDomain(entity) : null;
  }

  async findActiveByProductId(productId: string): Promise<Lot[]> {
    const entities = await this.qr.manager
      .createQueryBuilder('LotTypeOrmEntity', 'lot')
      .where('lot.productId = :productId', { productId })
      .andWhere('lot.deletedAt IS NULL')
      .orderBy('lot.receivedAt', 'ASC')
      .addOrderBy('lot.createdAt', 'ASC')
      .getMany();
    return entities.map((entity: any) => this.mapToDomain(entity));
  }

  async findActiveByProductIdForUpdate(productId: string): Promise<Lot[]> {
    const entities = await this.qr.manager
      .createQueryBuilder('LotTypeOrmEntity', 'lot')
      .where('lot.productId = :productId', { productId })
      .andWhere('lot.deletedAt IS NULL')
      .andWhere('lot.quantityAvailable > 0')
      .orderBy('lot.receivedAt', 'ASC')
      .addOrderBy('lot.createdAt', 'ASC')
      .setLock('pessimistic_write')
      .getMany();
    return entities.map((entity: any) => this.mapToDomain(entity));
  }

  async update(lot: Lot): Promise<Lot> {
    await this.qr.manager.update('LotTypeOrmEntity', lot.id, this.mapToEntity(lot));
    const updated = await this.qr.manager.findOne('LotTypeOrmEntity', { where: { id: lot.id } });
    if (!updated) throw new Error('Lot not found after update');
    return this.mapToDomain(updated);
  }

  async setQuantityAvailable(id: string, quantityAvailable: number): Promise<void> {
    await this.qr.manager.update('LotTypeOrmEntity', id, { quantityAvailable });
  }

  async softDelete(id: string): Promise<void> {
    await this.qr.manager.softDelete('LotTypeOrmEntity', id);
  }

  async recalculateEstimatedProfit(productId: string, salePrice: number): Promise<void> {
    await this.qr.manager
      .createQueryBuilder()
      .update('LotTypeOrmEntity')
      .set({ estimatedUnitProfit: () => `${salePrice} - "COS_UNI_LOT"` })
      .where('"PRO_ID" = :productId', { productId })
      .andWhere('"DEL_AT" IS NULL')
      .execute();
  }

  private mapToDomain(entity: any): Lot {
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

  private mapToEntity(lot: Lot): any {
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
