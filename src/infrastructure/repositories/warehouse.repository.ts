import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WarehouseTypeOrmEntity } from '../database/entities/warehouse.typeorm.entity';
import { Warehouse } from '../../domain/entities/warehouse.entity';
import { IWarehouseRepository, WarehouseFilters } from '../../domain/repositories/warehouse.repository.interface';
import { PaginationParams, PaginatedResult } from '../../domain/repositories/pagination.types';

@Injectable()
export class WarehouseRepository implements IWarehouseRepository {
  constructor(
    @InjectRepository(WarehouseTypeOrmEntity)
    private readonly repo: Repository<WarehouseTypeOrmEntity>,
  ) {}

  private mapToDomain(entity: WarehouseTypeOrmEntity): Warehouse {
    return new Warehouse({
      id: entity.id,
      branchId: entity.branchId,
      name: entity.name,
      isMain: entity.isMain,
      isActive: entity.isActive,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  private mapToEntity(warehouse: Warehouse): Partial<WarehouseTypeOrmEntity> {
    return {
      branchId: warehouse.branchId,
      name: warehouse.name,
      isMain: warehouse.isMain,
      isActive: warehouse.isActive,
    };
  }

  async findById(id: string): Promise<Warehouse | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? this.mapToDomain(entity) : null;
  }

  async findByBranchId(branchId: string): Promise<Warehouse[]> {
    const entities = await this.repo.find({ where: { branchId } });
    return entities.map((e) => this.mapToDomain(e));
  }

  async findMainByBranchId(branchId: string): Promise<Warehouse | null> {
    const entity = await this.repo.findOne({ where: { branchId, isMain: true } });
    return entity ? this.mapToDomain(entity) : null;
  }

  async findAll(
    pagination: PaginationParams = { page: 1, limit: 20 },
    filters: WarehouseFilters = {},
  ): Promise<PaginatedResult<Warehouse>> {
    const { page, limit } = pagination;
    const { q, branchId, isActive, isMain } = filters;

    const queryBuilder = this.repo.createQueryBuilder('warehouse');

    if (q) {
      queryBuilder.where('warehouse.name ILIKE :q', { q: `%${q}%` });
    }
    if (branchId) {
      queryBuilder.andWhere('warehouse.branchId = :branchId', { branchId });
    }
    if (isActive !== undefined) {
      queryBuilder.andWhere('warehouse.isActive = :isActive', { isActive });
    }
    if (isMain !== undefined) {
      queryBuilder.andWhere('warehouse.isMain = :isMain', { isMain });
    }

    const total = await queryBuilder.getCount();
    queryBuilder.skip((page - 1) * limit).take(limit);
    queryBuilder.orderBy('warehouse.createdAt', 'DESC');

    const entities = await queryBuilder.getMany();

    return {
      data: entities.map((e) => this.mapToDomain(e)),
      total,
      page,
      limit,
    };
  }

  async create(warehouse: Warehouse): Promise<Warehouse> {
    const entity = this.repo.create(this.mapToEntity(warehouse) as WarehouseTypeOrmEntity);
    const saved = await this.repo.save(entity);
    return this.mapToDomain(saved);
  }

  async update(warehouse: Warehouse): Promise<Warehouse> {
    await this.repo.update(warehouse.id, this.mapToEntity(warehouse) as any);
    const updated = await this.repo.findOne({ where: { id: warehouse.id } });
    if (!updated) throw new Error('Warehouse not found after update');
    return this.mapToDomain(updated);
  }
}