import { randomUUID } from 'crypto';
import { QueryRunner } from 'typeorm';
import type { IInvoiceItemRepository } from '../../../../domain/repositories';
import { InvoiceItem } from '../../../../domain/entities';

export class InvoiceItemRepositoryImpl implements IInvoiceItemRepository {
  constructor(private readonly qr: QueryRunner) {}

  async createMany(items: InvoiceItem[]): Promise<InvoiceItem[]> {
    const entities = items.map((item) =>
      this.qr.manager.create('InvoiceItemTypeOrmEntity', {
        id: item.id ?? randomUUID(),
        invoiceId: item.invoiceId,
        productId: item.productId,
        productNameSnapshot: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRateId: item.taxRateId,
        taxPercentage: item.taxPercentage,
        taxAmount: item.taxAmount,
      }),
    );

    const saved = await this.qr.manager.save('InvoiceItemTypeOrmEntity', entities);
    return (Array.isArray(saved) ? saved : [saved]).map((entity: any) => this.mapToDomain(entity));
  }

  async findByInvoiceId(invoiceId: string): Promise<InvoiceItem[]> {
    const entities = await this.qr.manager
      .createQueryBuilder('InvoiceItemTypeOrmEntity', 'item')
      .leftJoinAndSelect('item.product', 'product')
      .where('item.invoiceId = :invoiceId', { invoiceId })
      .orderBy('item.id', 'ASC')
      .getMany();

    return entities.map((entity: any) => this.mapToDomain(entity));
  }

  private mapToDomain(entity: any): InvoiceItem {
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
}
