import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InvoiceItemLot } from '../../domain/entities';
import type { IInvoiceItemLotRepository } from '../../domain/repositories';
import { InvoiceItemLotTypeOrmEntity } from '../database/entities/invoice-item-lot.typeorm.entity';

@Injectable()
export class InvoiceItemLotRepository implements IInvoiceItemLotRepository {
  constructor(
    @InjectRepository(InvoiceItemLotTypeOrmEntity)
    private readonly repo: Repository<InvoiceItemLotTypeOrmEntity>,
  ) {}

  async createMany(records: InvoiceItemLot[]): Promise<InvoiceItemLot[]> {
    const saved = await this.repo.save(records.map((record) => this.repo.create(this.mapToEntity(record))));
    return saved.map((entity) => this.mapToDomain(entity));
  }

  async findByInvoiceItemId(invoiceItemId: string): Promise<InvoiceItemLot[]> {
    const entities = await this.repo.find({
      where: { invoiceItemId },
      relations: { lot: true },
      order: { createdAt: 'ASC' },
    });
    return entities.map((entity) => this.mapToDomain(entity));
  }

  async findByInvoiceId(invoiceId: string): Promise<InvoiceItemLot[]> {
    const entities = await this.repo
      .createQueryBuilder('record')
      .leftJoinAndSelect('record.lot', 'lot')
      .leftJoin('record.invoiceItem', 'item')
      .where('item.invoiceId = :invoiceId', { invoiceId })
      .orderBy('record.createdAt', 'ASC')
      .getMany();
    return entities.map((entity) => this.mapToDomain(entity));
  }

  private mapToDomain(entity: InvoiceItemLotTypeOrmEntity): InvoiceItemLot {
    return new InvoiceItemLot({
      id: String(entity.id),
      invoiceItemId: entity.invoiceItemId,
      lotId: entity.lotId,
      lotCode: entity.lot?.lotCode,
      quantityUsed: Number(entity.quantityUsed),
      unitCostSnapshot: Number(entity.unitCostSnapshot),
      profitAmount: Number(entity.profitAmount),
      createdAt: entity.createdAt,
    });
  }

  private mapToEntity(record: InvoiceItemLot): Partial<InvoiceItemLotTypeOrmEntity> {
    return {
      id: record.id,
      invoiceItemId: record.invoiceItemId,
      lotId: record.lotId,
      quantityUsed: record.quantityUsed,
      unitCostSnapshot: record.unitCostSnapshot,
      profitAmount: record.profitAmount,
    };
  }
}
