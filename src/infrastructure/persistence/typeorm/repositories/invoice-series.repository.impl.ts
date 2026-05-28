import { QueryRunner } from 'typeorm';
import type { IInvoiceSeriesRepository, InvoiceSeriesFilters, PaginationParams, PaginatedResult } from '../../../../domain/repositories';
import { InvoiceSeries } from '../../../../domain/entities';
import { InvoiceSeriesTypeOrmEntity } from '../../../database/entities/invoice-series.typeorm.entity';

export class InvoiceSeriesRepositoryImpl implements IInvoiceSeriesRepository {
  constructor(private readonly qr: QueryRunner) {}

  async findById(id: string): Promise<InvoiceSeries | null> {
    const entity = await this.qr.manager.findOne('InvoiceSeriesTypeOrmEntity', { where: { id } });
    return entity ? this.mapToDomain(entity) : null;
  }

  async findActiveByBranchId(branchId: string): Promise<InvoiceSeries | null> {
    const entity = await this.qr.manager.findOne('InvoiceSeriesTypeOrmEntity', {
      where: { branchId, isActive: true },
    });
    return entity ? this.mapToDomain(entity) : null;
  }

  async findAll(
    pagination: PaginationParams = { page: 1, limit: 20 },
    filters: InvoiceSeriesFilters = {},
  ): Promise<PaginatedResult<InvoiceSeries>> {
    const queryBuilder = this.qr.manager.createQueryBuilder('InvoiceSeriesTypeOrmEntity', 'series');

    if (filters.branchId) {
      queryBuilder.andWhere('series.branchId = :branchId', { branchId: filters.branchId });
    }
    if (filters.isActive !== undefined) {
      queryBuilder.andWhere('series.isActive = :isActive', { isActive: filters.isActive });
    }

    const total = await queryBuilder.getCount();
    const entities = await queryBuilder
      .skip((pagination.page - 1) * pagination.limit)
      .take(pagination.limit)
      .orderBy('series.createdAt', 'DESC')
      .getMany();

    return {
      data: entities.map((entity: any) => this.mapToDomain(entity)),
      total,
      page: pagination.page,
      limit: pagination.limit,
    };
  }

  async create(invoiceSeries: InvoiceSeries): Promise<InvoiceSeries> {
    const entity = this.qr.manager.create('InvoiceSeriesTypeOrmEntity', this.mapToEntity(invoiceSeries));
    const saved = await this.qr.manager.save('InvoiceSeriesTypeOrmEntity', entity);
    return this.mapToDomain(saved);
  }

  async update(invoiceSeries: InvoiceSeries): Promise<InvoiceSeries> {
    await this.qr.manager.update('InvoiceSeriesTypeOrmEntity', invoiceSeries.id, this.mapToEntity(invoiceSeries));
    const updated = await this.qr.manager.findOne('InvoiceSeriesTypeOrmEntity', { where: { id: invoiceSeries.id } });
    if (!updated) throw new Error('InvoiceSeries not found after update');
    return this.mapToDomain(updated);
  }

  async incrementSequence(id: string): Promise<number> {
    const entity = await this.qr.manager.findOne(InvoiceSeriesTypeOrmEntity, {
      where: { id },
      lock: { mode: 'pessimistic_write' },
    });

    if (!entity) {
      throw new Error('InvoiceSeries not found');
    }

    entity.currentSequence += 1;
    const saved = await this.qr.manager.save(entity);
    return saved.currentSequence;
  }

  private mapToDomain(entity: any): InvoiceSeries {
    return new InvoiceSeries({
      id: String(entity.id),
      branchId: entity.branchId,
      establishmentCode: entity.establishmentCode,
      emissionPointCode: entity.emissionPointCode,
      currentSequence: Number(entity.currentSequence),
      isActive: Boolean(entity.isActive),
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  private mapToEntity(series: InvoiceSeries): any {
    return {
      id: series.id,
      branchId: series.branchId,
      establishmentCode: series.establishmentCode,
      emissionPointCode: series.emissionPointCode,
      currentSequence: series.currentSequence,
      isActive: series.isActive,
    };
  }
}
