import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
      productName: entity.product?.name,
      quantity: entity.quantity,
      unitPrice: Number(entity.unitPrice),
    });
  }

  async createMany(items: InvoiceItem[]): Promise<InvoiceItem[]> {
    const entities = this.invoiceItemRepository.create(
      items.map((item) => ({
        invoiceId: item.invoiceId,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
    );

    const saved = await this.invoiceItemRepository.save(entities);
    return saved.map((entity) => this.mapToDomain(entity));
  }

  async findByInvoiceId(invoiceId: string): Promise<InvoiceItem[]> {
    const entities = await this.invoiceItemRepository.find({
      where: { invoiceId },
      relations: ['product'],
    });

    return entities.map((entity) => this.mapToDomain(entity));
  }
}
