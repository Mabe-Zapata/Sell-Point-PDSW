import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { InvoiceItemTypeOrmEntity } from '../database/entities/invoice-item.typeorm.entity';
import { InvoiceItem } from '../../domain/entities';
import { IInvoiceItemRepository } from '../../domain/repositories/invoice-item.repository.interface';

@Injectable()
export class InvoiceItemRepository implements IInvoiceItemRepository {
  constructor(
    @InjectRepository(InvoiceItemTypeOrmEntity)
    private readonly invoiceItemRepository: Repository<InvoiceItemTypeOrmEntity>,
  ) {}

  private mapToDomain(entity: InvoiceItemTypeOrmEntity): InvoiceItem {
    return new InvoiceItem({
      id: String(entity.id),
      invoiceId: entity.invoiceId,
      productId: entity.productId,
      productName: entity.productNameSnapshot ?? entity.product?.name,
      quantity: Number(entity.quantity),
      unitPrice: Number(entity.unitPrice),
      taxRateId: entity.taxRateId ?? undefined,
      taxPercentage: Number(entity.taxPercentage ?? 0),
      taxAmount: Number(entity.taxAmount ?? 0),
    });
  }

  async createMany(items: InvoiceItem[]): Promise<InvoiceItem[]> {
    const entities = this.invoiceItemRepository.create(
      items.map((item) => ({
        id: item.id ?? randomUUID(),
        invoiceId: item.invoiceId,
        productId: item.productId,
        productNameSnapshot: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRateId: item.taxRateId,
        taxPercentage: item.taxPercentage,
        taxAmount: item.taxAmount,
      })),
    );

    const saved = await this.invoiceItemRepository.save(entities);
    return saved.map((entity) => this.mapToDomain(entity));
  }

  async findByInvoiceId(invoiceId: string): Promise<InvoiceItem[]> {
    const entities = await this.invoiceItemRepository.find({
      where: { invoiceId },
      relations: ['product'],
      order: { id: 'ASC' },
    });

    const items = entities.map((entity) => this.mapToDomain(entity));
    await this.attachLotCodes(items);
    return items;
  }

  private async attachLotCodes(items: InvoiceItem[]): Promise<void> {
    if (items.length === 0) return;

    const itemIds = items.map((item) => item.id);
    const rows = await this.invoiceItemRepository.manager
      .createQueryBuilder('InvoiceItemLotTypeOrmEntity', 'record')
      .leftJoinAndSelect('record.lot', 'lot')
      .where('record.invoiceItemId IN (:...itemIds)', { itemIds })
      .getMany();

    const lotCodesByItemId = new Map<string, string[]>();
    for (const row of rows as any[]) {
      const codes = lotCodesByItemId.get(row.invoiceItemId) ?? [];
      if (row.lot?.lotCode) codes.push(row.lot.lotCode);
      lotCodesByItemId.set(row.invoiceItemId, codes);
    }

    for (const item of items) {
      item.lotCodes = lotCodesByItemId.get(item.id) ?? [];
    }
  }
}
