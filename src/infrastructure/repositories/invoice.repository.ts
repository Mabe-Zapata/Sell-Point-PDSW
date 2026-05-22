import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InvoiceTypeOrmEntity } from '../database/entities/invoice.typeorm.entity';
import { Invoice } from '../../domain/entities/invoice.entity';
import { InvoiceItem } from '../../domain/entities/invoice-item.entity';
import {
  IInvoiceRepository,
  InvoiceFilters,
} from '../../domain/repositories/invoice.repository.interface';
import { PaginatedResult } from '../../domain/repositories/pagination.types';

@Injectable()
export class InvoiceRepository implements IInvoiceRepository {
  constructor(
    @InjectRepository(InvoiceTypeOrmEntity)
    private readonly invoiceRepository: Repository<InvoiceTypeOrmEntity>,
  ) {}

  private mapToDomain(entity: InvoiceTypeOrmEntity): Invoice {
    return new Invoice({
      id: entity.id,
      invoiceNumber: entity.invoiceNumber,
      invoiceDate: entity.invoiceDate,
      customerId: entity.customerId,
      customerName: entity.customer
        ? `${entity.customer.name} ${entity.customer.lastName}`
        : undefined,
      subtotal: Number(entity.subtotal),
      iva: Number(entity.iva),
      total: Number(entity.total),
      items: entity.items
        ? entity.items.map(
            (item) =>
              new InvoiceItem({
                id: item.id,
                invoiceId: item.invoiceId,
                productId: item.productId,
                productName: item.product?.name ?? undefined,
                quantity: item.quantity,
                unitPrice: Number(item.unitPrice),
              }),
          )
        : undefined,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt ?? undefined,
    });
  }

  async findById(id: string): Promise<Invoice | null> {
    const entity = await this.invoiceRepository.findOne({
      where: { id },
      relations: ['customer', 'items', 'items.product'],
      withDeleted: false,
    });
    return entity ? this.mapToDomain(entity) : null;
  }

  async findAll(
    pagination: { page: number; limit: number } = { page: 1, limit: 20 },
    filters: InvoiceFilters = {},
  ): Promise<PaginatedResult<Invoice>> {
    const { page, limit } = pagination;
    const { id, customer, invoiceNumber } = filters;

    const queryBuilder = this.invoiceRepository
      .createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.customer', 'customer');

    // Apply invoice ID filter if provided
    if (id) {
      queryBuilder.andWhere('invoice.id LIKE :id', {
        id: `%${id}%`,
      });
    }

    // Apply customer filter if provided (search in customer name or lastName)
    if (customer) {
      queryBuilder.andWhere(
        '(customer.name LIKE :customer OR customer.lastName LIKE :customer)',
        { customer: `%${customer}%` },
      );
    }

    // Apply invoiceNumber filter if provided (partial LIKE match)
    if (invoiceNumber) {
      queryBuilder.andWhere('invoice.invoiceNumber LIKE :invoiceNumber', {
        invoiceNumber: `%${invoiceNumber}%`,
      });
    }

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Order by invoice date descending
    queryBuilder.orderBy('invoice.invoiceDate', 'DESC');

    const entities = await queryBuilder.getMany();

    return {
      data: entities.map((entity) => this.mapToDomain(entity)),
      total,
      page,
      limit,
    };
  }

  async create(invoice: Invoice): Promise<Invoice> {
    const entity = this.invoiceRepository.create({
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.invoiceDate,
      customerId: invoice.customerId,
      subtotal: invoice.subtotal,
      iva: invoice.iva,
      total: invoice.total,
    });

    const saved = await this.invoiceRepository.save(entity);
    return this.mapToDomain(saved);
  }

  async softDelete(id: string): Promise<void> {
    await this.invoiceRepository.softDelete(id);
  }

  async countByInvoiceNumberPrefix(prefix: string): Promise<number> {
    return this.invoiceRepository
      .createQueryBuilder('invoice')
      .where('invoice.invoiceNumber LIKE :prefix', { prefix: `${prefix}%` })
      .getCount();
  }
}
