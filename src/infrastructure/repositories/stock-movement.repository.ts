import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StockMovementTypeOrmEntity } from '../database/entities/stock-movement.typeorm.entity';
import { StockMovement } from '../../domain/entities/stock-movement.entity';
import { StockMovementTypeMapper } from '../database/entities/enums/stock-movement-type.db-enum';
import { IStockMovementRepository } from '../../domain/repositories/stock-movement.repository.interface';
import { PaginationParams, PaginatedResult } from '../../domain/repositories/pagination.types';
import { StockMovementFilters } from '../../domain/repositories/stock-movement.repository.interface';

@Injectable()
export class StockMovementRepository {
  constructor(
    @InjectRepository(StockMovementTypeOrmEntity)
    private readonly repo: Repository<StockMovementTypeOrmEntity>,
  ) {}

  private mapToDomain(entity: StockMovementTypeOrmEntity): StockMovement {
    return new StockMovement({
      id: entity.id,
      productId: entity.productId,
      type: StockMovementTypeMapper.toDomain(entity.type),
      quantity: Number(entity.quantity),
      previousStock: entity.previousStock,
      newStock: entity.newStock,
      userId: entity.userId,
      referenceType: entity.referenceType,
      referenceId: entity.referenceId,
      description: entity.description,
      createdAt: entity.createdAt,
    });
  }

  private mapToEntity(movement: StockMovement): Partial<StockMovementTypeOrmEntity> {
    return {
      productId: movement.productId,
      type: StockMovementTypeMapper.toDb(movement.type),
      quantity: movement.quantity,
      previousStock: movement.previousStock,
      newStock: movement.newStock,
      userId: movement.userId,
      referenceType: movement.referenceType,
      referenceId: movement.referenceId,
      description: movement.description,
    };
  }

  async findById(id: number): Promise<StockMovement | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? this.mapToDomain(entity) : null;
  }

  async findByProduct(productId: string): Promise<StockMovement[]> {
    const entities = await this.repo.find({ where: { productId } });
    return entities.map((e) => this.mapToDomain(e));
  }

  async findAll(
    pagination: PaginationParams = { page: 1, limit: 20 },
    filters: StockMovementFilters = {},
  ): Promise<PaginatedResult<StockMovement>> {
    const { page, limit } = pagination;
    const { productId, type, userId, referenceType, referenceId } = filters;

    const queryBuilder = this.repo.createQueryBuilder('movement');

    if (productId) {
      queryBuilder.andWhere('movement.productId = :productId', { productId });
    }
    if (type) {
      queryBuilder.andWhere('movement.type = :type', { type });
    }
    if (userId) {
      queryBuilder.andWhere('movement.userId = :userId', { userId });
    }
    if (referenceType) {
      queryBuilder.andWhere('movement.referenceType = :referenceType', { referenceType });
    }
    if (referenceId) {
      queryBuilder.andWhere('movement.referenceId = :referenceId', { referenceId });
    }

    const total = await queryBuilder.getCount();
    queryBuilder.skip((page - 1) * limit).take(limit);
    queryBuilder.orderBy('movement.createdAt', 'DESC');

    const entities = await queryBuilder.getMany();

    return {
      data: entities.map((e) => this.mapToDomain(e)),
      total,
      page,
      limit,
    };
  }

  async create(movement: StockMovement): Promise<StockMovement> {
    const entity = this.repo.create(this.mapToEntity(movement) as StockMovementTypeOrmEntity);
    const saved = await this.repo.save(entity);
    return this.mapToDomain(saved);
  }
}
