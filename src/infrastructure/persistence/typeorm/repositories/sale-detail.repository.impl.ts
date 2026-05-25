import { QueryRunner } from 'typeorm';
import type { ISaleDetailRepository } from '../../../../domain/repositories';
import { SaleDetail } from '../../../../domain/entities';

/**
 * Transaction-scoped SaleDetailRepository implementation.
 * Used exclusively through TypeOrmUnitOfWork to participate in the same transaction.
 */
export class SaleDetailRepositoryImpl implements ISaleDetailRepository {
  constructor(private readonly qr: QueryRunner) {}

  async findById(id: string): Promise<SaleDetail | null> {
    const entity = await this.qr.manager.findOne('SaleDetailTypeOrmEntity', { where: { id } });
    return entity ? this.mapToDomain(entity) : null;
  }

  async findBySaleId(saleId: string): Promise<SaleDetail[]> {
    const entities = await this.qr.manager.find('SaleDetailTypeOrmEntity', { where: { saleId } });
    return entities.map((e: any) => this.mapToDomain(e));
  }

  async findAll(pagination?: any, filters?: any): Promise<any> {
    const queryBuilder = this.qr.manager
      .createQueryBuilder('SaleDetailTypeOrmEntity', 'sd')
      .skip((pagination.page - 1) * pagination.limit)
      .take(pagination.limit);

    if (filters?.saleId) queryBuilder.andWhere('sd.saleId = :saleId', { saleId: filters.saleId });
    if (filters?.productId) queryBuilder.andWhere('sd.productId = :productId', { productId: filters.productId });

    const [entities, total] = await queryBuilder.getManyAndCount();
    return {
      data: entities.map((e: any) => this.mapToDomain(e)),
      total,
      page: pagination.page,
      limit: pagination.limit,
    };
  }

  async create(detail: SaleDetail): Promise<SaleDetail> {
    const entity = this.qr.manager.create('SaleDetailTypeOrmEntity', this.mapToEntity(detail));
    const saved = await this.qr.manager.save('SaleDetailTypeOrmEntity', entity);
    return this.mapToDomain(saved);
  }

  async update(detail: SaleDetail): Promise<SaleDetail> {
    await this.qr.manager.update('SaleDetailTypeOrmEntity', detail.id, this.mapToEntity(detail));
    const updated = await this.qr.manager.findOne('SaleDetailTypeOrmEntity', { where: { id: detail.id } });
    if (!updated) throw new Error('SaleDetail not found after update');
    return this.mapToDomain(updated);
  }

  async deleteBySaleId(saleId: string): Promise<void> {
    await this.qr.manager.delete('SaleDetailTypeOrmEntity', { saleId });
  }

  private mapToDomain(entity: any): SaleDetail {
    return new SaleDetail({
      id: entity.id,
      saleId: entity.saleId,
      productId: entity.productId,
      productName: entity.productNameSnapshot,
      productCode: entity.productCodeSnapshot,
      quantity: Number(entity.quantity),
      unitPrice: Number(entity.unitPrice),
      createdAt: entity.createdAt,
    });
  }

  private mapToEntity(detail: SaleDetail): any {
    return {
      saleId: detail.saleId,
      productId: detail.productId,
      productNameSnapshot: detail.productName,
      productCodeSnapshot: detail.productCode,
      quantity: detail.quantity,
      unitPrice: detail.unitPrice,
    };
  }
}