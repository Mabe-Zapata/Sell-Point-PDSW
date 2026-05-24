import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ProductTypeOrmEntity } from '../database/entities/product.typeorm.entity';
import { Product } from '../../domain/entities';
import type { IProductRepository, ProductFilters, PaginationParams, PaginatedResult } from '../../domain/repositories';

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
      currentStock: entity.availableQuantity ?? 0,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  private mapToEntity(product: Product): Partial<ProductTypeOrmEntity> {
    return {
      categoryId: product.categoryId,
      code: product.code,
      name: product.name,
      salePrice: product.salePrice,
      costPrice: product.costPrice,
      isActive: product.isActive,
      availableQuantity: product.currentStock,
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
      queryBuilder.where('product.name ILIKE :q OR product.code ILIKE :q', { q: `%${q}%` });
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
    await this.repo.update(product.id, this.mapToEntity(product) as any);
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

  async decrementStock(_id: number, _quantity: number): Promise<void> {
    return;
  }
}
