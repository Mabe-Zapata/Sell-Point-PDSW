import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { SaleTypeOrmEntity } from '../database/entities/sale.typeorm.entity';
import { SaleDetailTypeOrmEntity } from '../database/entities/sale-detail.typeorm.entity';
import { Sale, SaleDetail } from '../../domain/entities';
import { SaleStatusMapper } from '../database/entities/enums/sale-status.db-enum';
import { PaymentMethodMapper, PaymentMethodDb } from '../database/entities/enums/payment-method.db-enum';
import type { ISaleRepository, SaleFilters, PaginationParams, PaginatedResult } from '../../domain/repositories';

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
      paymentMethod: PaymentMethodMapper.toDomain(entity.paymentMethod as PaymentMethodDb),
      status: SaleStatusMapper.toDomain(entity.status),
      subtotal: Number(entity.subtotal),
      taxAmount: Number(entity.taxAmount),
      discountAmount: Number(entity.discountAmount),
      total: Number(entity.total),
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  private mapToDomainWithDetails(entity: SaleTypeOrmEntity, details: SaleDetailTypeOrmEntity[]): Sale {
    const sale = this.mapToDomain(entity);
    sale.details = details.map((d) =>
      new SaleDetail({
        id: d.id,
        saleId: d.saleId,
        productId: d.productId,
        productName: d.productNameSnapshot,
        productCode: d.productCodeSnapshot,
        quantity: Number(d.quantity),
        unitPrice: Number(d.unitPrice),
        createdAt: d.createdAt,
      }),
    );
    return sale;
  }

  private mapToEntity(sale: Sale): Partial<SaleTypeOrmEntity> {
    return {
      id: sale.id,
      branchId: sale.branchId,
      customerId: sale.customerId ?? undefined,
      cashierUserId: sale.cashierUserId,
      taxRateId: sale.taxRateId,
      saleNumber: sale.saleNumber,
      paymentMethod: PaymentMethodMapper.toDb(sale.paymentMethod),
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
    const entity = this.repo.create(this.mapToEntity(sale) as SaleTypeOrmEntity);
    const saved = await this.repo.save(entity);
    return this.mapToDomain(saved);
  }

  async update(sale: Sale): Promise<Sale> {
    await this.repo.update(sale.id, this.mapToEntity(sale) as any);
    const updated = await this.repo.findOne({ where: { id: sale.id } });
    if (!updated) throw new Error('Sale not found after update');
    return this.mapToDomain(updated);
  }

  async findByIdWithDetails(id: string): Promise<Sale | null> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const saleEntity = await queryRunner.manager
        .createQueryBuilder(SaleTypeOrmEntity, 'sale')
        .where('sale.id = :id', { id })
        .setLock('pessimistic_write')
        .getOne();

      if (!saleEntity) {
        return null;
      }

      const detailEntities = await queryRunner.manager
        .createQueryBuilder(SaleDetailTypeOrmEntity, 'sd')
        .where('sd.saleId = :saleId', { saleId: id })
        .getMany();

      return this.mapToDomainWithDetails(saleEntity, detailEntities);
    } finally {
      await queryRunner.release();
    }
  }
}