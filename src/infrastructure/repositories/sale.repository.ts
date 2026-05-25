import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { SaleTypeOrmEntity } from '../database/entities/sale.typeorm.entity';
import { Sale } from '../../domain/entities/sale.entity';
import { SaleStatusMapper } from '../database/entities/enums/sale-status.db-enum';
import { ISaleRepository, SaleFilters } from '../../domain/repositories/sale.repository.interface';
import { PaginationParams, PaginatedResult } from '../../domain/repositories/pagination.types';

@Injectable()
export class SaleRepository implements ISaleRepository {
  constructor(
    @InjectRepository(SaleTypeOrmEntity)
    private readonly repo: Repository<SaleTypeOrmEntity>,
    private readonly dataSource: DataSource,
  ) {}

  private mapToDomain(entity: SaleTypeOrmEntity): Sale {
    return new Sale({
      id: entity.id,
      branchId: entity.branchId,
      customerId: entity.customerId,
      cashierUserId: entity.cashierUserId,
      taxRateId: entity.taxRateId,
      saleNumber: entity.saleNumber,
      status: SaleStatusMapper.toDomain(entity.status),
      subtotal: Number(entity.subtotal),
      taxAmount: Number(entity.taxAmount),
      discountAmount: Number(entity.discountAmount),
      total: Number(entity.total),
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  private mapToEntity(sale: Sale): Partial<SaleTypeOrmEntity> {
    return {
      branchId: sale.branchId,
      customerId: sale.customerId,
      cashierUserId: sale.cashierUserId,
      taxRateId: sale.taxRateId,
      saleNumber: sale.saleNumber,
      status: SaleStatusMapper.toDb(sale.status),
      subtotal: sale.subtotal,
      taxAmount: sale.taxAmount,
      discountAmount: sale.discountAmount,
      total: sale.total,
    };
  }

  async findById(id: string): Promise<Sale | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? this.mapToDomain(entity) : null;
  }

  async findBySaleNumber(saleNumber: string): Promise<Sale | null> {
    const entity = await this.repo.findOne({ where: { saleNumber } });
    return entity ? this.mapToDomain(entity) : null;
  }

  async findAll(
    pagination: PaginationParams = { page: 1, limit: 20 },
    filters: SaleFilters = {},
  ): Promise<PaginatedResult<Sale>> {
    const { page, limit } = pagination;
    const { q, branchId, customerId, cashierUserId, status } = filters;

    const queryBuilder = this.repo.createQueryBuilder('sale');

    if (branchId) {
      queryBuilder.andWhere('sale.branchId = :branchId', { branchId });
    }
    if (customerId) {
      queryBuilder.andWhere('sale.customerId = :customerId', { customerId });
    }
    if (cashierUserId) {
      queryBuilder.andWhere('sale.cashierUserId = :cashierUserId', { cashierUserId });
    }
    if (status) {
      queryBuilder.andWhere('sale.status = :status', { status });
    }

    const total = await queryBuilder.getCount();
    queryBuilder.skip((page - 1) * limit).take(limit);
    queryBuilder.orderBy('sale.createdAt', 'DESC');

    const entities = await queryBuilder.getMany();

    return {
      data: entities.map((e) => this.mapToDomain(e)),
      total,
      page,
      limit,
    };
  }

  async create(sale: Sale): Promise<Sale> {
    const dbData = this.mapToEntity(sale);

    await this.dataSource
      .createQueryBuilder()
      .insert()
      .into(SaleTypeOrmEntity)
      .values({
        id: sale.id,
        branchId: dbData.branchId ?? '',
        customerId: dbData.customerId ?? '',
        cashierUserId: dbData.cashierUserId ?? '',
        taxRateId: dbData.taxRateId ?? '',
        saleNumber: dbData.saleNumber ?? '',
        status: dbData.status ?? 'DRAFT',
        subtotal: dbData.subtotal ?? 0,
        taxAmount: dbData.taxAmount ?? 0,
        discountAmount: dbData.discountAmount ?? 0,
        total: dbData.total ?? 0,
      })
      .execute();

    // Return the sale with all fields as passed (already has all domain data)
    return sale;
  }

  async update(sale: Sale): Promise<Sale> {
    await this.repo.update(sale.id, this.mapToEntity(sale));
    const updated = await this.repo.findOne({ where: { id: sale.id } });
    if (!updated) throw new Error('Sale not found after update');
    return this.mapToDomain(updated);
  }
}