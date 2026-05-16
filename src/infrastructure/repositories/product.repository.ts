import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ProductTypeOrmEntity } from '../database/entities/product.typeorm.entity';
import { Product } from '../../domain/entities/product.entity';
import {
  IProductRepository,
  ProductFilters,
} from '../../domain/repositories/product.repository.interface';
import { InsufficientStockException } from '../../domain/exceptions/insufficient-stock.exception';
import { PaginatedResult } from '../../domain/repositories/customer.repository.interface';

@Injectable()
export class ProductRepository implements IProductRepository {
  constructor(
    @InjectRepository(ProductTypeOrmEntity)
    private readonly productRepository: Repository<ProductTypeOrmEntity>,
    private readonly dataSource: DataSource,
  ) {}

  private mapToDomain(entity: ProductTypeOrmEntity): Product {
    return new Product({
      id: entity.id,
      code: entity.code,
      name: entity.name,
      description: entity.description ?? undefined,
      unitPrice: Number(entity.unitPrice),
      availableQuantity: entity.availableQuantity,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt ?? undefined,
    });
  }

  async findById(id: string): Promise<Product | null> {
    const entity = await this.productRepository.findOne({
      where: { id },
      withDeleted: false,
    });
    return entity ? this.mapToDomain(entity) : null;
  }

  async findAll(
    pagination: { page: number; limit: number } = { page: 1, limit: 20 },
    filters: ProductFilters = {},
  ): Promise<PaginatedResult<Product>> {
    const { page, limit } = pagination;
    const { q } = filters;

    const queryBuilder = this.productRepository.createQueryBuilder('product');

    // Apply search filter if provided
    if (q) {
      queryBuilder.where('(product.id LIKE :q OR product.code LIKE :q OR product.name LIKE :q)', {
        q: `%${q}%`,
      });
    }

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Order by creation date descending
    queryBuilder.orderBy('product.createdAt', 'DESC');

    const entities = await queryBuilder.getMany();

    return {
      data: entities.map((entity) => this.mapToDomain(entity)),
      total,
      page,
      limit,
    };
  }

  async create(product: Product): Promise<Product> {
    const entity = this.productRepository.create({
      code: product.code,
      name: product.name,
      description: product.description,
      unitPrice: product.unitPrice,
      availableQuantity: product.availableQuantity,
    });

    const saved = await this.productRepository.save(entity);
    return this.mapToDomain(saved);
  }

  async update(product: Product): Promise<Product> {
    await this.productRepository.update(product.id, {
      code: product.code,
      name: product.name,
      description: product.description,
      unitPrice: product.unitPrice,
      availableQuantity: product.availableQuantity,
    });

    const updated = await this.productRepository.findOne({
      where: { id: product.id },
    });

    if (!updated) {
      throw new Error('Product not found after update');
    }

    return this.mapToDomain(updated);
  }

  async decrementStock(id: string, quantity: number): Promise<Product> {
    // Use a query runner for transaction support
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Lock the row for update to prevent race conditions
      const productEntity = await queryRunner.manager.findOne(
        ProductTypeOrmEntity,
        {
          where: { id },
          lock: { mode: 'pessimistic_write' },
        },
      );

      if (!productEntity) {
        throw new Error('Product not found');
      }

      const newQuantity = productEntity.availableQuantity - quantity;

      if (newQuantity < 0) {
        throw new InsufficientStockException(
          productEntity.name,
          quantity,
          productEntity.availableQuantity,
        );
      }

      await queryRunner.manager.update(ProductTypeOrmEntity, id, {
        availableQuantity: newQuantity,
      });

      await queryRunner.commitTransaction();

      return this.mapToDomain({
        ...productEntity,
        availableQuantity: newQuantity,
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async softDelete(id: string): Promise<void> {
    await this.productRepository.softDelete(id);
  }
}
