import { QueryRunner } from 'typeorm';
import type { IStockMovementRepository } from '../../../../domain/repositories';
import { StockMovement } from '../../../../domain/entities';
import { StockMovementTypeMapper } from '../../../database/entities/enums/stock-movement-type.db-enum';

/**
 * Transaction-scoped StockMovementRepository implementation.
 * Used exclusively through TypeOrmUnitOfWork to participate in the same transaction.
 */
export class StockMovementRepositoryImpl implements IStockMovementRepository {
  constructor(private readonly qr: QueryRunner) {}

  async findById(id: string): Promise<StockMovement | null> {
    const entity = await this.qr.manager.findOne('StockMovementTypeOrmEntity', { where: { id } });
    return entity ? this.mapToDomain(entity) : null;
  }

  async findAll(pagination?: any, filters?: any): Promise<any> {
    const queryBuilder = this.qr.manager
      .createQueryBuilder('StockMovementTypeOrmEntity', 'movement')
      .skip((pagination.page - 1) * pagination.limit)
      .take(pagination.limit);

    if (filters?.productId) queryBuilder.andWhere('movement.productId = :productId', { productId: filters.productId });
    if (filters?.type) queryBuilder.andWhere('movement.type = :type', { type: filters.type });
    if (filters?.userId) queryBuilder.andWhere('movement.userId = :userId', { userId: filters.userId });
    if (filters?.referenceType) queryBuilder.andWhere('movement.referenceType = :referenceType', { referenceType: filters.referenceType });
    if (filters?.referenceId) queryBuilder.andWhere('movement.referenceId = :referenceId', { referenceId: filters.referenceId });

    const [entities, total] = await queryBuilder.getManyAndCount();
    return {
      data: entities.map((e: any) => this.mapToDomain(e)),
      total,
      page: pagination.page,
      limit: pagination.limit,
    };
  }

  async create(movement: StockMovement): Promise<StockMovement> {
    const entity = this.qr.manager.create('StockMovementTypeOrmEntity', this.mapToEntity(movement));
    const saved = await this.qr.manager.save('StockMovementTypeOrmEntity', entity);
    return this.mapToDomain(saved);
  }

  private mapToDomain(entity: any): StockMovement {
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

  private mapToEntity(movement: StockMovement): any {
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
}