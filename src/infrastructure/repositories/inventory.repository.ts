import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryTypeOrmEntity } from '../database/entities/inventory.typeorm.entity';
import { Inventory } from '../../domain/entities/inventory.entity';
import { IInventoryRepository } from '../../domain/repositories/inventory.repository.interface';
import { PaginationParams, PaginatedResult } from '../../domain/repositories/pagination.types';
import { InventoryFilters } from '../../domain/repositories/inventory.repository.interface';

@Injectable()
export class InventoryRepository {
  constructor(
    @InjectRepository(InventoryTypeOrmEntity)
    private readonly repo: Repository<InventoryTypeOrmEntity>,
  ) {}

  private mapToDomain(entity: InventoryTypeOrmEntity): Inventory {
    return new Inventory({
      id: entity.id,
      warehouseId: entity.warehouseId,
      productId: entity.productId,
      currentStock: entity.currentStock,
      minimumStock: entity.minimumStock,
      maximumStock: entity.maximumStock,
      updatedAt: entity.updatedAt,
    });
  }

  private mapToEntity(inventory: Inventory): Partial<InventoryTypeOrmEntity> {
    return {
      warehouseId: inventory.warehouseId,
      productId: inventory.productId,
      currentStock: inventory.currentStock,
      minimumStock: inventory.minimumStock,
      maximumStock: inventory.maximumStock,
    };
  }

  async findById(id: string): Promise<Inventory | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? this.mapToDomain(entity) : null;
  }

  async findByWarehouseAndProduct(warehouseId: string, productId: string): Promise<Inventory | null> {
    const entity = await this.repo.findOne({ where: { warehouseId, productId } });
    return entity ? this.mapToDomain(entity) : null;
  }

  async findAll(
    pagination: PaginationParams = { page: 1, limit: 20 },
    filters: InventoryFilters = {},
  ): Promise<PaginatedResult<Inventory>> {
    const { page, limit } = pagination;
    const { warehouseId, productId } = filters;

    const queryBuilder = this.repo.createQueryBuilder('inventory');

    if (warehouseId) {
      queryBuilder.andWhere('inventory.warehouseId = :warehouseId', { warehouseId });
    }
    if (productId) {
      queryBuilder.andWhere('inventory.productId = :productId', { productId });
    }

    const total = await queryBuilder.getCount();
    queryBuilder.skip((page - 1) * limit).take(limit);
    queryBuilder.orderBy('inventory.updatedAt', 'DESC');

    const entities = await queryBuilder.getMany();

    return {
      data: entities.map((e) => this.mapToDomain(e)),
      total,
      page,
      limit,
    };
  }

  async findByWarehouse(warehouseId: string): Promise<Inventory[]> {
    const entities = await this.repo.find({ where: { warehouseId } });
    return entities.map((e) => this.mapToDomain(e));
  }

  async findByProduct(productId: string): Promise<Inventory[]> {
    const entities = await this.repo.find({ where: { productId } });
    return entities.map((e) => this.mapToDomain(e));
  }

  async create(inventory: Inventory): Promise<Inventory> {
    const entity = this.repo.create(this.mapToEntity(inventory) as InventoryTypeOrmEntity);
    const saved = await this.repo.save(entity);
    return this.mapToDomain(saved);
  }

  async update(inventory: Inventory): Promise<Inventory> {
    await this.repo.update(inventory.id, this.mapToEntity(inventory) as any);
    const updated = await this.repo.findOne({ where: { id: inventory.id } });
    if (!updated) throw new Error('Inventory not found after update');
    return this.mapToDomain(updated);
  }

  async updateStock(id: string, currentStock: number): Promise<Inventory> {
    await this.repo.update(id, { currentStock } as any);
    const updated = await this.repo.findOne({ where: { id } });
    if (!updated) throw new Error('Inventory not found after stock update');
    return this.mapToDomain(updated);
  }
}
