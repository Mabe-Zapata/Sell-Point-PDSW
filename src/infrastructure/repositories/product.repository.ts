import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductTypeOrmEntity } from '../database/entities/product.typeorm.entity';
import { Product } from '../../domain/entities/product.entity';
import { IProductRepository, ProductFilters } from '../../domain/repositories/product.repository.interface';
import { PaginationParams, PaginatedResult } from '../../domain/repositories/pagination.types';

@Injectable()
export class ProductRepository implements IProductRepository {
  constructor(
    @InjectRepository(ProductTypeOrmEntity)
    private readonly repo: Repository<ProductTypeOrmEntity>,
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
    await this.repo.update(product.id, this.mapToEntity(product));
    const updated = await this.repo.findOne({ where: { id: product.id } });
    if (!updated) throw new Error('Product not found after update');
    return this.mapToDomain(updated);
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async decrementStock(_id: number, _quantity: number): Promise<void> {
    return;
  }
}
