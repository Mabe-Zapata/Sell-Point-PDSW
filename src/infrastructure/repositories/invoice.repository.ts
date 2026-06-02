import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InvoiceTypeOrmEntity } from '../database/entities/invoice.typeorm.entity';
import { Invoice } from '../../domain/entities';
import { InvoiceStatusMapper } from '../database/entities/enums/invoice-status.db-enum';
import type { IInvoiceRepository, InvoiceFilters, PaginationParams, PaginatedResult } from '../../domain/repositories';

@Injectable()
export class InvoiceRepository implements IInvoiceRepository {
  constructor(
    @InjectRepository(InvoiceTypeOrmEntity)
    private readonly repo: Repository<InvoiceTypeOrmEntity>,
  ) {}

  private mapToDomain(entity: InvoiceTypeOrmEntity): Invoice {
    return new Invoice({
      id: String(entity.id),
      saleId: entity.saleId,
      seriesId: entity.seriesId,
      invoiceNumber: entity.invoiceNumber,
      authorizationNumber: entity.authorizationNumber,
      issueDate: entity.issueDate,
      status: InvoiceStatusMapper.toDomain(entity.status),
      cancelledAt: entity.cancelledAt,
      createdAt: entity.createdAt,
      profitTotal: Number(entity.profitTotal ?? 0),
    });
  }

  private mapToEntity(invoice: Invoice): Partial<InvoiceTypeOrmEntity> {
    return {
      id: invoice.id,
      saleId: invoice.saleId,
      seriesId: invoice.seriesId,
      invoiceNumber: invoice.invoiceNumber,
      authorizationNumber: invoice.authorizationNumber,
      issueDate: invoice.issueDate,
      status: InvoiceStatusMapper.toDb(invoice.status),
      cancelledAt: invoice.cancelledAt,
      profitTotal: invoice.profitTotal,
    };
  }

  async findById(id: string): Promise<Invoice | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? this.mapToDomain(entity) : null;
  }

  async findBySaleId(saleId: string): Promise<Invoice | null> {
    const entity = await this.repo.findOne({ where: { saleId } });
    return entity ? this.mapToDomain(entity) : null;
  }

  async findByInvoiceNumber(invoiceNumber: string): Promise<Invoice | null> {
    const entity = await this.repo.findOne({ where: { invoiceNumber } });
    return entity ? this.mapToDomain(entity) : null;
  }

  async findAll(
    pagination: PaginationParams = { page: 1, limit: 20 },
    filters: InvoiceFilters = {},
  ): Promise<PaginatedResult<Invoice>> {
    const { page, limit } = pagination;
    const { saleId, seriesId, status, authorizationNumber } = filters;

    const queryBuilder = this.repo.createQueryBuilder('invoice');
    if (saleId) {
      queryBuilder.andWhere('invoice.saleId = :saleId', { saleId });
    }
    if (seriesId) {
      queryBuilder.andWhere('invoice.seriesId = :seriesId', { seriesId });
    }
    if (status) {
      queryBuilder.andWhere('invoice.status = :status', { status });
    }
    if (authorizationNumber) {
      queryBuilder.andWhere('LOWER(invoice.authorizationNumber) LIKE LOWER(:authorizationNumber)', { authorizationNumber: `%${authorizationNumber}%` });
    }

    const total = await queryBuilder.getCount();
    queryBuilder.skip((page - 1) * limit).take(limit);
    queryBuilder.orderBy('invoice.createdAt', 'DESC');

    const entities = await queryBuilder.getMany();

    return {
      data: entities.map((e) => this.mapToDomain(e)),
      total,
      page,
      limit,
    };
  }

  async countByInvoiceNumberPrefix(prefix: string): Promise<number> {
    return this.repo
      .createQueryBuilder('invoice')
      .where('invoice.invoiceNumber LIKE :prefix', { prefix: `${prefix}%` })
      .getCount();
  }

  async create(invoice: Invoice): Promise<Invoice> {
    const entity = this.repo.create(this.mapToEntity(invoice) as InvoiceTypeOrmEntity);
    const saved = await this.repo.save(entity);
    return this.mapToDomain(saved);
  }

  async update(invoice: Invoice): Promise<Invoice> {
    await this.repo.update(invoice.id, this.mapToEntity(invoice));
    const updated = await this.repo.findOne({ where: { id: invoice.id } });
    if (!updated) throw new Error('Invoice not found after update');
    return this.mapToDomain(updated);
  }
}
