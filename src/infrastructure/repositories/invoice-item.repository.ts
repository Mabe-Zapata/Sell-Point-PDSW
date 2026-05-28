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

    return entities.map((entity) => this.mapToDomain(entity));
  }
}
