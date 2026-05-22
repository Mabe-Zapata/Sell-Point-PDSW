import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SalesHistoryTypeOrmEntity } from '../database/entities/sales-history.typeorm.entity';
import { SalesHistory } from '../../domain/entities/sales-history.entity';
import { ISalesHistoryRepository } from '../../domain/repositories/sales-history.repository.interface';

@Injectable()
export class SalesHistoryRepository implements ISalesHistoryRepository {
  constructor(
    @InjectRepository(SalesHistoryTypeOrmEntity)
    private readonly repo: Repository<SalesHistoryTypeOrmEntity>,
  ) {}

  private mapToDomain(entity: SalesHistoryTypeOrmEntity): SalesHistory {
    return new SalesHistory({
      id: entity.id,
      saleId: entity.saleId,
      originalCreatedAt: entity.originalCreatedAt,
      movedAt: entity.movedAt,
    });
  }

  private mapToEntity(history: SalesHistory): Partial<SalesHistoryTypeOrmEntity> {
    return {
      saleId: history.saleId,
      originalCreatedAt: history.originalCreatedAt,
      movedAt: history.movedAt,
    };
  }

  async findById(id: string): Promise<SalesHistory | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? this.mapToDomain(entity) : null;
  }

  async findBySaleId(saleId: string): Promise<SalesHistory | null> {
    const entity = await this.repo.findOne({ where: { saleId } });
    return entity ? this.mapToDomain(entity) : null;
  }

  async create(history: SalesHistory): Promise<SalesHistory> {
    const entity = this.repo.create(this.mapToEntity(history) as SalesHistoryTypeOrmEntity);
    const saved = await this.repo.save(entity);
    return this.mapToDomain(saved);
  }
}