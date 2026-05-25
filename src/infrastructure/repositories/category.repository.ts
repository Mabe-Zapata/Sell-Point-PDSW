/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoryTypeOrmEntity } from '../database/entities/category.typeorm.entity';
import { Category } from '../../domain/entities/category.entity';
import { ICategoryRepository, CategoryFilters } from '../../domain/repositories/category.repository.interface';
import { PaginationParams, PaginatedResult } from '../../domain/repositories/pagination.types';

@Injectable()
export class CategoryRepository implements ICategoryRepository {
  constructor(
    @InjectRepository(CategoryTypeOrmEntity)
    private readonly repo: Repository<CategoryTypeOrmEntity>,
  ) {}

  private mapToDomain(entity: CategoryTypeOrmEntity): Category {
    return new Category({
      id: String(entity.id),
      name: entity.name,
      description: entity.description,
      isActive: entity.isActive,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  private mapToEntity(category: Category): Partial<CategoryTypeOrmEntity> {
    return {
      name: category.name,
      description: category.description,
      isActive: category.isActive,
    };
  }

  async findById(id: string): Promise<Category | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? this.mapToDomain(entity) : null;
  }

  async findByName(name: string): Promise<Category | null> {
    const entity = await this.repo.findOne({ where: { name } });
    return entity ? this.mapToDomain(entity) : null;
  }

  async findAll(
    pagination: PaginationParams = { page: 1, limit: 20 },
    filters: CategoryFilters = {},
  ): Promise<PaginatedResult<Category>> {
    const { page, limit } = pagination;
    const { q, isActive } = filters;

    const queryBuilder = this.repo.createQueryBuilder('category');

    if (q) {
      queryBuilder.where('LOWER(category.name) LIKE LOWER(:q)', { q: `%${q}%` });
    }
    if (isActive !== undefined) {
      queryBuilder.andWhere('category.isActive = :isActive', { isActive });
    }

    const total = await queryBuilder.getCount();
    queryBuilder.skip((page - 1) * limit).take(limit);
    queryBuilder.orderBy('category.createdAt', 'DESC');

    const entities = await queryBuilder.getMany();

    return {
      data: entities.map((e) => this.mapToDomain(e)),
      total,
      page,
      limit,
    };
  }

  async create(category: Category): Promise<Category> {
    const entity = this.repo.create(this.mapToEntity(category) as CategoryTypeOrmEntity);
    const saved = await this.repo.save(entity);
    return this.mapToDomain(saved);
  }

  async update(category: Category): Promise<Category> {
    await this.repo.update(category.id, this.mapToEntity(category) as any);
    const updated = await this.repo.findOne({ where: { id: category.id } });
    if (!updated) throw new Error('Category not found after update');
    return this.mapToDomain(updated);
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}