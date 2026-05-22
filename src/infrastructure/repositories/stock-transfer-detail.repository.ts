import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StockTransferDetailTypeOrmEntity } from '../database/entities/stock-transfer-detail.typeorm.entity';
import { StockTransferDetail } from '../../domain/entities/stock-transfer-detail.entity';
import { IStockTransferDetailRepository } from '../../domain/repositories/stock-transfer-detail.repository.interface';
import { PaginationParams, PaginatedResult } from '../../domain/repositories/pagination.types';
import { StockTransferDetailFilters } from '../../domain/repositories/stock-transfer-detail.repository.interface';

@Injectable()
export class StockTransferDetailRepository {
  constructor(
    @InjectRepository(StockTransferDetailTypeOrmEntity)
    private readonly repo: Repository<StockTransferDetailTypeOrmEntity>,
  ) {}

  private mapToDomain(entity: StockTransferDetailTypeOrmEntity): StockTransferDetail {
    return new StockTransferDetail({
      id: entity.id,
      stockTransferId: entity.stockTransferId,
      productId: entity.productId,
      quantity: Number(entity.quantity),
      createdAt: entity.createdAt,
    });
  }

  private mapToEntity(detail: StockTransferDetail): Partial<StockTransferDetailTypeOrmEntity> {
    return {
      stockTransferId: detail.stockTransferId,
      productId: detail.productId,
      quantity: detail.quantity,
    };
  }

  async findById(id: string): Promise<StockTransferDetail | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? this.mapToDomain(entity) : null;
  }

  async findByStockTransferId(stockTransferId: string): Promise<StockTransferDetail[]> {
    const entities = await this.repo.find({ where: { stockTransferId } });
    return entities.map((e) => this.mapToDomain(e));
  }

  async findAll(
    pagination: PaginationParams = { page: 1, limit: 20 },
    filters: StockTransferDetailFilters = {},
  ): Promise<PaginatedResult<StockTransferDetail>> {
    const { page, limit } = pagination;
    const { stockTransferId, productId } = filters;

    const queryBuilder = this.repo.createQueryBuilder('detail');

    if (stockTransferId) {
      queryBuilder.andWhere('detail.stockTransferId = :stockTransferId', { stockTransferId });
    }
    if (productId) {
      queryBuilder.andWhere('detail.productId = :productId', { productId });
    }

    const total = await queryBuilder.getCount();
    queryBuilder.skip((page - 1) * limit).take(limit);
    queryBuilder.orderBy('detail.createdAt', 'DESC');

    const entities = await queryBuilder.getMany();

    return {
      data: entities.map((e) => this.mapToDomain(e)),
      total,
      page,
      limit,
    };
  }

  async create(detail: StockTransferDetail): Promise<StockTransferDetail> {
    const entity = this.repo.create(this.mapToEntity(detail) as StockTransferDetailTypeOrmEntity);
    const saved = await this.repo.save(entity);
    return this.mapToDomain(saved);
  }
}
