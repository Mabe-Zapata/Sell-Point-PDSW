import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ProductTypeOrmEntity } from '../database/entities/product.typeorm.entity';
import { Product } from '../../domain/entities';
import type { IProductRepository, ProductFilters, PaginationParams, PaginatedResult } from '../../domain/repositories';
import { EntityNotFoundException } from '../../domain/exceptions/entity-not-found.exception';
import { InsufficientStockException } from '../../domain/exceptions/insufficient-stock.exception';

@Injectable()
export class ProductRepository implements IProductRepository {
  constructor(
    @InjectRepository(ProductTypeOrmEntity)
    private readonly repo: Repository<ProductTypeOrmEntity>,
    private readonly dataSource?: DataSource,
  ) {}

  private mapToDomain(entity: ProductTypeOrmEntity): Product {
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

  private mapToEntity(product: Product): Partial<ProductTypeOrmEntity> {
    return {
      id: product.id,
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

  async findById(id: string): Promise<Product | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? this.mapToDomain(entity) : null;
  }

  async findByCode(code: string): Promise<Product | null> {
    const entity = await this.repo.findOne({ where: { code } });
    return entity ? this.mapToDomain(entity) : null;
  }

  async findAll(
    pagination: PaginationParams = { page: 1, limit: 20 },
    filters: ProductFilters = {},
  ): Promise<PaginatedResult<Product>> {
    const { page, limit } = pagination;
    const { q, categoryId, isActive } = filters;

    const queryBuilder = this.repo.createQueryBuilder('product');

    if (q) {
      queryBuilder.where('LOWER(product.name) LIKE LOWER(:q) OR LOWER(product.code) LIKE LOWER(:q)', { q: `%${q}%` });
    }
    if (categoryId) {
      queryBuilder.andWhere('product.categoryId = :categoryId', { categoryId });
    }
    if (isActive !== undefined) {
      queryBuilder.andWhere('product.isActive = :isActive', { isActive });
    }

    const total = await queryBuilder.getCount();
    queryBuilder.skip((page - 1) * limit).take(limit);
    queryBuilder.orderBy('product.createdAt', 'DESC');

    const entities = await queryBuilder.getMany();

    return {
      data: entities.map((e) => this.mapToDomain(e)),
      total,
      page,
      limit,
    };
  }

  async create(product: Product): Promise<Product> {
    const entity = this.repo.create(this.mapToEntity(product) as ProductTypeOrmEntity);
    const saved = await this.repo.save(entity);
    return this.mapToDomain(saved);
  }

  async update(product: Product): Promise<Product> {
    await this.repo.update(product.id, this.mapToEntity(product));
    const updated = await this.repo.findOne({ where: { id: product.id } });
    if (!updated) throw new Error('Product not found after update');
    return this.mapToDomain(updated);
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async findByIdForUpdate(id: string): Promise<Product | null> {
    if (!this.dataSource) {
      // Fallback when DataSource is not available
      const found = await this.repo.findOne({ where: { id } });
      return found ? this.mapToDomain(found) : null;
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const entity = await queryRunner.manager
        .createQueryBuilder(ProductTypeOrmEntity, 'product')
        .where('product.id = :id', { id })
        .setLock('pessimistic_write')
        .getOne();

      return entity ? this.mapToDomain(entity) : null;
    } finally {
      await queryRunner.release();
    }
  }

  async incrementStock(id: string, quantity: number): Promise<void> {
    const result = await this.repo
      .createQueryBuilder()
      .update(ProductTypeOrmEntity)
      .set({ currentStock: () => `"CUR_STO_PRO" + ${quantity}` })
      .where('id = :id', { id })
      .execute();

    if (result.affected === 0) {
      throw new EntityNotFoundException('Product', id);
    }
  }

  async decrementStock(id: string, quantity: number): Promise<void> {
    const result = await this.repo
      .createQueryBuilder()
      .update(ProductTypeOrmEntity)
      .set({ currentStock: () => `"CUR_STO_PRO" - ${quantity}` })
      .where('id = :id', { id })
      .andWhere(`"CUR_STO_PRO" >= :qty`, { qty: quantity })
      .execute();

    if (result.affected === 0) {
      const product = await this.repo.findOne({ where: { id } });
      if (!product) throw new EntityNotFoundException('Product', id);
      throw new InsufficientStockException(product.name, quantity, product.currentStock);
    }
  }
}
