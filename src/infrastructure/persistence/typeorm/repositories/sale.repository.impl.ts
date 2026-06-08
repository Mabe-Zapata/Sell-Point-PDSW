import { QueryRunner } from 'typeorm';
import type { ISaleRepository } from '../../../../domain/repositories';
import { Sale, SaleDetail } from '../../../../domain/entities';
import { SaleStatusMapper } from '../../../database/entities/enums/sale-status.db-enum';

/**
 * Transaction-scoped SaleRepository implementation.
 * Used exclusively through TypeOrmUnitOfWork to participate in the same transaction.
 */
export class SaleRepositoryImpl implements ISaleRepository {
  constructor(private readonly qr: QueryRunner) {}

  async findById(id: string): Promise<Sale | null> {
    const entity = await this.qr.manager.findOne('SaleTypeOrmEntity', { where: { id } });
    return entity ? this.mapToDomain(entity) : null;
  }

  async findBySaleNumber(saleNumber: string): Promise<Sale | null> {
    const entity = await this.qr.manager.findOne('SaleTypeOrmEntity', { where: { saleNumber } });
    return entity ? this.mapToDomain(entity) : null;
  }

  async getNextSaleNumber(): Promise<string> {
    const rows = await this.qr.manager
      .createQueryBuilder('SaleTypeOrmEntity', 'sale')
      .select('sale.saleNumber', 'saleNumber')
      .where('sale.saleNumber LIKE :prefix', { prefix: 'SAL-%' })
      .getRawMany<{ saleNumber: string }>();

    let maxSequence = 0;
    for (const row of rows) {
      const match = /^SAL-(\d+)$/.exec(String(row.saleNumber ?? '').trim());
      if (!match) continue;
      const seq = Number(match[1]);
      if (Number.isFinite(seq) && seq > maxSequence) maxSequence = seq;
    }

    return `SAL-${String(maxSequence + 1).padStart(6, '0')}`;
  }

  async findAll(pagination?: any, filters?: any): Promise<any> {
    const queryBuilder = this.qr.manager
      .createQueryBuilder('SaleTypeOrmEntity', 'sale')
      .skip((pagination.page - 1) * pagination.limit)
      .take(pagination.limit);

    if (filters?.branchId) queryBuilder.andWhere('sale.branchId = :branchId', { branchId: filters.branchId });
    if (filters?.customerId) queryBuilder.andWhere('sale.customerId = :customerId', { customerId: filters.customerId });
    if (filters?.cashierUserId) queryBuilder.andWhere('sale.cashierUserId = :cashierUserId', { cashierUserId: filters.cashierUserId });
    if (filters?.status) queryBuilder.andWhere('sale.status = :status', { status: filters.status });

    const [entities, total] = await queryBuilder.getManyAndCount();
    return {
      data: entities.map((e: any) => this.mapToDomain(e)),
      total,
      page: pagination.page,
      limit: pagination.limit,
    };
  }

  async create(sale: Sale): Promise<Sale> {
    const entity = this.qr.manager.create('SaleTypeOrmEntity', this.mapToEntity(sale));
    const saved = await this.qr.manager.save('SaleTypeOrmEntity', entity);
    return this.mapToDomain(saved);
  }

  async update(sale: Sale): Promise<Sale> {
    await this.qr.manager.update('SaleTypeOrmEntity', sale.id, this.mapToEntity(sale));
    const updated = await this.qr.manager.findOne('SaleTypeOrmEntity', { where: { id: sale.id } });
    if (!updated) throw new Error('Sale not found after update');
    return this.mapToDomain(updated);
  }

  async findByIdWithDetails(id: string): Promise<Sale | null> {
    const saleEntity = await this.qr.manager
      .createQueryBuilder('SaleTypeOrmEntity', 'sale')
      .where('sale.id = :id', { id })
      .setLock('pessimistic_write')
      .getOne();

    if (!saleEntity) return null;

    const detailEntities = await this.qr.manager
      .createQueryBuilder('SaleDetailTypeOrmEntity', 'sd')
      .where('sd.saleId = :saleId', { saleId: id })
      .getMany();

    const sale = this.mapToDomain(saleEntity);
    sale.details = detailEntities.map((e: any) => this.mapDetailToDomain(e));

    if (saleEntity.customerId) {
      const customer = await this.qr.manager.findOne('CustomerTypeOrmEntity', {
        where: { id: saleEntity.customerId },
      }) as {
        email?: string;
        firstName?: string;
        lastName?: string;
      } | null;

      sale.customerEmail = customer?.email;
      sale.customerName = customer
        ? `${customer.firstName ?? ''} ${customer.lastName ?? ''}`.trim() || 'Customer'
        : 'Customer';
    } else {
      sale.customerName = 'Customer';
    }

    return sale;
  }

  private mapToDomain(entity: any): Sale {
    return new Sale({
      id: entity.id,
      branchId: entity.branchId,
      customerId: entity.customerId,
      cashierUserId: entity.cashierUserId,
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

  private mapToEntity(sale: Sale): any {
    return {
      id: sale.id,
      branchId: sale.branchId,
      customerId: sale.customerId,
      cashierUserId: sale.cashierUserId,
      saleNumber: sale.saleNumber,
      status: SaleStatusMapper.toDb(sale.status),
      subtotal: sale.subtotal,
      taxAmount: sale.taxAmount,
      discountAmount: sale.discountAmount,
      total: sale.total,
    };
  }

  private mapDetailToDomain(entity: any): SaleDetail {
    return new SaleDetail({
      id: entity.id,
      saleId: entity.saleId,
      productId: entity.productId,
      productName: entity.productNameSnapshot,
      productCode: entity.productCodeSnapshot,
      quantity: Number(entity.quantity),
      unitPrice: Number(entity.unitPrice),
      taxRateId: entity.taxRateId,
      taxPercentage: Number(entity.taxPercentage),
      taxAmount: Number(entity.taxAmount),
      createdAt: entity.createdAt,
    });
  }
}
