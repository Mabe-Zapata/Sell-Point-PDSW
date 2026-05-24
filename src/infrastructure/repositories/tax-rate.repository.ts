import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaxRateTypeOrmEntity } from '../database/entities/tax-rate.typeorm.entity';
import { TaxRate } from '../../domain/entities/tax-rate.entity';
import { ITaxRateRepository } from '../../domain/repositories/tax-rate.repository.interface';
import { PaginationParams, PaginatedResult } from '../../domain/repositories/pagination.types';
import { TaxRateFilters } from '../../domain/repositories/tax-rate.repository.interface';

@Injectable()
export class TaxRateRepository {
  constructor(
    @InjectRepository(TaxRateTypeOrmEntity)
    private readonly repo: Repository<TaxRateTypeOrmEntity>,
  ) {}

  private mapToDomain(entity: TaxRateTypeOrmEntity): TaxRate {
    return new TaxRate({
      id: entity.id,
      name: entity.name,
      percentage: Number(entity.percentage),
      isActive: entity.isActive,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  private mapToEntity(taxRate: TaxRate): Partial<TaxRateTypeOrmEntity> {
    return {
      name: taxRate.name,
      percentage: taxRate.percentage,
      isActive: taxRate.isActive,
    };
  }

  async findById(id: string): Promise<TaxRate | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? this.mapToDomain(entity) : null;
  }

  async findByName(name: string): Promise<TaxRate | null> {
    const entity = await this.repo.findOne({ where: { name } });
    return entity ? this.mapToDomain(entity) : null;
  }

  async findByPercentage(percentage: number): Promise<TaxRate | null> {
    const entity = await this.repo.findOne({ where: { percentage } as any });
    return entity ? this.mapToDomain(entity) : null;
  }

  async findAll(
    pagination: PaginationParams = { page: 1, limit: 20 },
    filters: TaxRateFilters = {},
  ): Promise<PaginatedResult<TaxRate>> {
    const { page, limit } = pagination;
    const { q, isActive } = filters;

    const queryBuilder = this.repo.createQueryBuilder('taxRate');

    if (q) {
      queryBuilder.where('taxRate.name ILIKE :q', { q: `%${q}%` });
    }
    if (isActive !== undefined) {
      queryBuilder.andWhere('taxRate.isActive = :isActive', { isActive });
    }

    const total = await queryBuilder.getCount();
    queryBuilder.skip((page - 1) * limit).take(limit);
    queryBuilder.orderBy('taxRate.createdAt', 'DESC');

    const entities = await queryBuilder.getMany();

    return {
      data: entities.map((e) => this.mapToDomain(e)),
      total,
      page,
      limit,
    };
  }

  async create(taxRate: TaxRate): Promise<TaxRate> {
    const entity = this.repo.create(this.mapToEntity(taxRate) as TaxRateTypeOrmEntity);
    const saved = await this.repo.save(entity);
    return this.mapToDomain(saved);
  }

  async update(taxRate: TaxRate): Promise<TaxRate> {
    await this.repo.update(taxRate.id, this.mapToEntity(taxRate) as any);
    const updated = await this.repo.findOne({ where: { id: taxRate.id } });
    if (!updated) throw new Error('TaxRate not found after update');
    return this.mapToDomain(updated);
  }
}
