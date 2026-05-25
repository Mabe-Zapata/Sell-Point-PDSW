import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InvoiceSeriesTypeOrmEntity } from '../database/entities/invoice-series.typeorm.entity';
import { InvoiceSeries } from '../../domain/entities';
import type { IInvoiceSeriesRepository, InvoiceSeriesFilters, PaginationParams, PaginatedResult } from '../../domain/repositories';

@Injectable()
export class InvoiceSeriesRepository {
  constructor(
    @InjectRepository(InvoiceSeriesTypeOrmEntity)
    private readonly repo: Repository<InvoiceSeriesTypeOrmEntity>,
  ) {}

  private mapToDomain(entity: InvoiceSeriesTypeOrmEntity): InvoiceSeries {
    return new InvoiceSeries({
      id: String(entity.id),
      branchId: entity.branchId,
      establishmentCode: entity.establishmentCode,
      emissionPointCode: entity.emissionPointCode,
      currentSequence: entity.currentSequence,
      isActive: entity.isActive,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  private mapToEntity(series: InvoiceSeries): Partial<InvoiceSeriesTypeOrmEntity> {
    return {
      id: series.id,
      branchId: series.branchId,
      establishmentCode: series.establishmentCode,
      emissionPointCode: series.emissionPointCode,
      currentSequence: series.currentSequence,
      isActive: series.isActive,
    };
  }

  async findById(id: string): Promise<InvoiceSeries | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? this.mapToDomain(entity) : null;
  }

  async findActiveByBranchId(branchId: string): Promise<InvoiceSeries | null> {
    const entity = await this.repo.findOne({ where: { branchId, isActive: true } });
    return entity ? this.mapToDomain(entity) : null;
  }

  async findByBranchAndCodes(
    branchId: string,
    establishmentCode: string,
    emissionPointCode: string,
  ): Promise<InvoiceSeries | null> {
    const entity = await this.repo.findOne({
      where: { branchId, establishmentCode, emissionPointCode },
    });
    return entity ? this.mapToDomain(entity) : null;
  }

  async findAll(
    pagination: PaginationParams = { page: 1, limit: 20 },
    filters: InvoiceSeriesFilters = {},
  ): Promise<PaginatedResult<InvoiceSeries>> {
    const { page, limit } = pagination;
    const { branchId, isActive } = filters;

    const queryBuilder = this.repo.createQueryBuilder('series');

    if (branchId) {
      queryBuilder.andWhere('series.branchId = :branchId', { branchId });
    }
    if (isActive !== undefined) {
      queryBuilder.andWhere('series.isActive = :isActive', { isActive });
    }

    const total = await queryBuilder.getCount();
    queryBuilder.skip((page - 1) * limit).take(limit);
    queryBuilder.orderBy('series.createdAt', 'DESC');

    const entities = await queryBuilder.getMany();

    return {
      data: entities.map((e) => this.mapToDomain(e)),
      total,
      page,
      limit,
    };
  }

  async create(series: InvoiceSeries): Promise<InvoiceSeries> {
    const entity = this.repo.create(this.mapToEntity(series) as InvoiceSeriesTypeOrmEntity);
    const saved = await this.repo.save(entity);
    return this.mapToDomain(saved);
  }

  async update(series: InvoiceSeries): Promise<InvoiceSeries> {
    await this.repo.update(series.id, this.mapToEntity(series) as any);
    const updated = await this.repo.findOne({ where: { id: series.id } });
    if (!updated) throw new Error('InvoiceSeries not found after update');
    return this.mapToDomain(updated);
  }

  async incrementSequence(id: string): Promise<number> {
    const current = await this.repo.findOne({ where: { id } });
    if (!current) {
      throw new Error('InvoiceSeries not found');
    }

    current.currentSequence += 1;
    await this.repo.save(current);
    return current.currentSequence;
  }
}
