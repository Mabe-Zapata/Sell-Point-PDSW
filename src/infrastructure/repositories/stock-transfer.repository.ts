import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StockTransferTypeOrmEntity } from '../database/entities/stock-transfer.typeorm.entity';
import { StockTransfer } from '../../domain/entities/stock-transfer.entity';
import { TransferStatusMapper } from '../database/entities/enums/transfer-status.db-enum';
import { IStockTransferRepository } from '../../domain/repositories/stock-transfer.repository.interface';
import { PaginationParams, PaginatedResult } from '../../domain/repositories/pagination.types';
import { StockTransferFilters } from '../../domain/repositories/stock-transfer.repository.interface';

@Injectable()
export class StockTransferRepository {
  constructor(
    @InjectRepository(StockTransferTypeOrmEntity)
    private readonly repo: Repository<StockTransferTypeOrmEntity>,
  ) {}

  private mapToDomain(entity: StockTransferTypeOrmEntity): StockTransfer {
    return new StockTransfer({
      id: entity.id,
      fromBranchId: entity.fromBranchId,
      toBranchId: entity.toBranchId,
      requesterUserId: entity.requesterUserId,
      approverUserId: entity.approverUserId,
      status: TransferStatusMapper.toDomain(entity.status),
      notes: entity.notes,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  private mapToEntity(transfer: StockTransfer): Partial<StockTransferTypeOrmEntity> {
    return {
      fromBranchId: transfer.fromBranchId,
      toBranchId: transfer.toBranchId,
      requesterUserId: transfer.requesterUserId,
      approverUserId: transfer.approverUserId,
      status: TransferStatusMapper.toDb(transfer.status),
      notes: transfer.notes,
    };
  }

  async findById(id: string): Promise<StockTransfer | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? this.mapToDomain(entity) : null;
  }

  async findAll(
    pagination: PaginationParams = { page: 1, limit: 20 },
    filters: StockTransferFilters = {},
  ): Promise<PaginatedResult<StockTransfer>> {
    const { page, limit } = pagination;
    const { q, fromBranchId, toBranchId, status, requesterUserId } = filters;

    const queryBuilder = this.repo.createQueryBuilder('transfer');

    if (q) {
      queryBuilder.where('transfer.notes ILIKE :q', { q: `%${q}%` });
    }
    if (fromBranchId) {
      queryBuilder.andWhere('transfer.fromBranchId = :fromBranchId', { fromBranchId });
    }
    if (toBranchId) {
      queryBuilder.andWhere('transfer.toBranchId = :toBranchId', { toBranchId });
    }
    if (status) {
      queryBuilder.andWhere('transfer.status = :status', { status });
    }
    if (requesterUserId) {
      queryBuilder.andWhere('transfer.requesterUserId = :requesterUserId', { requesterUserId });
    }

    const total = await queryBuilder.getCount();
    queryBuilder.skip((page - 1) * limit).take(limit);
    queryBuilder.orderBy('transfer.createdAt', 'DESC');

    const entities = await queryBuilder.getMany();

    return {
      data: entities.map((e) => this.mapToDomain(e)),
      total,
      page,
      limit,
    };
  }

  async create(transfer: StockTransfer): Promise<StockTransfer> {
    const entity = this.repo.create(this.mapToEntity(transfer) as StockTransferTypeOrmEntity);
    const saved = await this.repo.save(entity);
    return this.mapToDomain(saved);
  }

  async update(transfer: StockTransfer): Promise<StockTransfer> {
    await this.repo.update(transfer.id, this.mapToEntity(transfer) as any);
    const updated = await this.repo.findOne({ where: { id: transfer.id } });
    if (!updated) throw new Error('StockTransfer not found after update');
    return this.mapToDomain(updated);
  }
}
