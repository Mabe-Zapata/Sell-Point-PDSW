import { QueryRunner } from 'typeorm';
import type { IInvoiceRepository, InvoiceFilters, PaginationParams, PaginatedResult } from '../../../../domain/repositories';
import { Invoice } from '../../../../domain/entities';
import { InvoiceStatusMapper } from '../../../database/entities/enums/invoice-status.db-enum';

export class InvoiceRepositoryImpl implements IInvoiceRepository {
  constructor(private readonly qr: QueryRunner) {}

  async findById(id: string): Promise<Invoice | null> {
    const entity = await this.qr.manager.findOne('InvoiceTypeOrmEntity', { where: { id } });
    return entity ? this.mapToDomain(entity) : null;
  }

  async findBySaleId(saleId: string): Promise<Invoice | null> {
    const entity = await this.qr.manager.findOne('InvoiceTypeOrmEntity', { where: { saleId } });
    return entity ? this.mapToDomain(entity) : null;
  }

  async findAll(
    pagination: PaginationParams = { page: 1, limit: 20 },
    filters: InvoiceFilters = {},
  ): Promise<PaginatedResult<Invoice>> {
    const queryBuilder = this.qr.manager.createQueryBuilder('InvoiceTypeOrmEntity', 'invoice');

    if (filters.saleId) {
      queryBuilder.andWhere('invoice.saleId = :saleId', { saleId: filters.saleId });
    }
    if (filters.seriesId) {
      queryBuilder.andWhere('invoice.seriesId = :seriesId', { seriesId: filters.seriesId });
    }
    if (filters.status) {
      queryBuilder.andWhere('invoice.status = :status', { status: filters.status });
    }
    if (filters.authorizationNumber) {
      queryBuilder.andWhere('LOWER(invoice.authorizationNumber) LIKE LOWER(:authorizationNumber)', {
        authorizationNumber: `%${filters.authorizationNumber}%`,
      });
    }

    const total = await queryBuilder.getCount();
    const entities = await queryBuilder
      .skip((pagination.page - 1) * pagination.limit)
      .take(pagination.limit)
      .orderBy('invoice.createdAt', 'DESC')
      .getMany();

    return {
      data: entities.map((entity: any) => this.mapToDomain(entity)),
      total,
      page: pagination.page,
      limit: pagination.limit,
    };
  }

  async countByInvoiceNumberPrefix(prefix: string): Promise<number> {
    return this.qr.manager
      .createQueryBuilder('InvoiceTypeOrmEntity', 'invoice')
      .where('invoice.invoiceNumber LIKE :prefix', { prefix: `${prefix}%` })
      .getCount();
  }

  async create(invoice: Invoice): Promise<Invoice> {
    const entity = this.qr.manager.create('InvoiceTypeOrmEntity', this.mapToEntity(invoice));
    const saved = await this.qr.manager.save('InvoiceTypeOrmEntity', entity);
    return this.mapToDomain(saved);
  }

  async update(invoice: Invoice): Promise<Invoice> {
    await this.qr.manager.update('InvoiceTypeOrmEntity', invoice.id, this.mapToEntity(invoice));
    const updated = await this.qr.manager.findOne('InvoiceTypeOrmEntity', { where: { id: invoice.id } });
    if (!updated) throw new Error('Invoice not found after update');
    return this.mapToDomain(updated);
  }

  private mapToDomain(entity: any): Invoice {
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
      customerNameSnapshot: entity.customerNameSnapshot,
      customerCedulaSnapshot: entity.customerCedulaSnapshot,
      customerEmailSnapshot: entity.customerEmailSnapshot,
      cashierNameSnapshot: entity.cashierNameSnapshot,
      cashierUsernameSnapshot: entity.cashierUsernameSnapshot,
      cashierEmployeeIdSnapshot: entity.cashierEmployeeIdSnapshot,
    });
  }

  private mapToEntity(invoice: Invoice): any {
    return {
      id: invoice.id,
      saleId: invoice.saleId,
      seriesId: invoice.seriesId,
      invoiceNumber: invoice.invoiceNumber,
      authorizationNumber: invoice.authorizationNumber,
      issueDate: invoice.issueDate,
      status: InvoiceStatusMapper.toDb(invoice.status),
      cancelledAt: invoice.cancelledAt,
      customerNameSnapshot: invoice.customerNameSnapshot,
      customerCedulaSnapshot: invoice.customerCedulaSnapshot,
      customerEmailSnapshot: invoice.customerEmailSnapshot,
      cashierNameSnapshot: invoice.cashierNameSnapshot,
      cashierUsernameSnapshot: invoice.cashierUsernameSnapshot,
      cashierEmployeeIdSnapshot: invoice.cashierEmployeeIdSnapshot,
    };
  }
}
