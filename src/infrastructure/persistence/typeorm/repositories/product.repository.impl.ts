/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { QueryRunner } from 'typeorm';
import type { IProductRepository } from '../../../../domain/repositories';
import { Product } from '../../../../domain/entities';
import { EntityNotFoundException } from '../../../../domain/exceptions/entity-not-found.exception';
import { InsufficientStockException } from '../../../../domain/exceptions/insufficient-stock.exception';

/**
 * Transaction-scoped ProductRepository implementation.
 * Used exclusively through TypeOrmUnitOfWork to participate in the same transaction.
 */
export class ProductRepositoryImpl implements IProductRepository {
  constructor(private readonly qr: QueryRunner) {}

  async findById(id: string): Promise<Product | null> {
    const entity = await this.qr.manager.findOne('ProductTypeOrmEntity', { where: { id } });
    return entity ? this.mapToDomain(entity) : null;
  }

  async findByCode(code: string): Promise<Product | null> {
    const entity = await this.qr.manager.findOne('ProductTypeOrmEntity', { where: { code } });
    return entity ? this.mapToDomain(entity) : null;
  }

  async getNextCode(): Promise<string> {
    const rows = await this.qr.manager
      .createQueryBuilder('ProductTypeOrmEntity', 'product')
      .select('product.code', 'code')
      .where('product.code LIKE :prefix', { prefix: 'PROD-%' })
      .getRawMany<{ code: string }>();

    let maxSequence = 0;
    for (const row of rows) {
      const match = /^PROD-(\d+)$/.exec(String(row.code ?? '').trim());
      if (!match) continue;
      const seq = Number(match[1]);
      if (Number.isFinite(seq) && seq > maxSequence) maxSequence = seq;
    }

    return `PROD-${String(maxSequence + 1).padStart(3, '0')}`;
  }

  async findAll(pagination?: any, filters?: any): Promise<any> {
    const queryBuilder = this.qr.manager
      .createQueryBuilder('ProductTypeOrmEntity', 'product')
      .skip((pagination.page - 1) * pagination.limit)
      .take(pagination.limit);

    if (filters?.categoryId) queryBuilder.andWhere('product.categoryId = :categoryId', { categoryId: filters.categoryId });
    if (filters?.isActive !== undefined) queryBuilder.andWhere('product.isActive = :isActive', { isActive: filters.isActive });

    const [entities, total] = await queryBuilder.getManyAndCount();
    return {
      data: entities.map((e: any) => this.mapToDomain(e)),
      total,
      page: pagination.page,
      limit: pagination.limit,
    };
  }

  async create(product: Product): Promise<Product> {
    const entity = this.qr.manager.create('ProductTypeOrmEntity', this.mapToEntity(product));
    const saved = await this.qr.manager.save('ProductTypeOrmEntity', entity);
    return this.mapToDomain(saved);
  }

  async update(product: Product): Promise<Product> {
    await this.qr.manager.update('ProductTypeOrmEntity', product.id, this.mapToEntity(product));
    const updated = await this.qr.manager.findOne('ProductTypeOrmEntity', { where: { id: product.id } });
    if (!updated) throw new Error('Product not found after update');
    return this.mapToDomain(updated);
  }

  async softDelete(id: string): Promise<void> {
    await this.qr.manager.delete('ProductTypeOrmEntity', { id });
  }

  async findByIdForUpdate(id: string): Promise<Product | null> {
    const entity = await this.qr.manager
      .createQueryBuilder('ProductTypeOrmEntity', 'product')
      .where('product.id = :id', { id })
      .setLock('pessimistic_write')
      .getOne();
    return entity ? this.mapToDomain(entity) : null;
  }

  async incrementStock(id: string, quantity: number): Promise<void> {
    const result = await this.qr.manager
      .createQueryBuilder()
      .update('ProductTypeOrmEntity')
      .set({ currentStock: () => `"CUR_STO_PRO" + ${quantity}` })
      .where('id = :id', { id })
      .execute();

    if (result.affected === 0) {
      throw new EntityNotFoundException('Product', id);
    }
  }

  async decrementStock(id: string, quantity: number): Promise<void> {
    const result = await this.qr.manager
      .createQueryBuilder()
      .update('ProductTypeOrmEntity')
      .set({ currentStock: () => `"CUR_STO_PRO" - ${quantity}` })
      .where('id = :id', { id })
      .andWhere(`"CUR_STO_PRO" >= :qty`, { qty: quantity })
      .execute();

    if (result.affected === 0) {
      const product = await this.qr.manager.findOne('ProductTypeOrmEntity', { where: { id } }) as any;
      if (!product) throw new EntityNotFoundException('Product', id);
      throw new InsufficientStockException(product.name, quantity, product.currentStock);
    }
  }

  private mapToDomain(entity: any): Product {
    return new Product({
      id: String(entity.id),
      categoryId: entity.categoryId,
      code: entity.code,
      name: entity.name,
      description: entity.description,
      salePrice: Number(entity.salePrice),
      costPrice: Number(entity.costPrice),
      isActive: entity.isActive,
      currentStock: entity.currentStock ?? 0,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  private mapToEntity(product: Product): any {
    return {
      categoryId: product.categoryId,
      code: product.code,
      name: product.name,
      description: product.description,
      salePrice: product.salePrice,
      costPrice: product.costPrice,
      isActive: product.isActive,
      currentStock: product.currentStock,
    };
  }
}
