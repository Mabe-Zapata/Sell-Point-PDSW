import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SaleDetailTypeOrmEntity } from '../database/entities/sale-detail.typeorm.entity';
import { SaleDetail } from '../../domain/entities/sale-detail.entity';
import { ISaleDetailRepository } from '../../domain/repositories/sale-detail.repository.interface';

@Injectable()
export class SaleDetailRepository {
  constructor(
    @InjectRepository(SaleDetailTypeOrmEntity)
    private readonly repo: Repository<SaleDetailTypeOrmEntity>,
  ) {}

  private mapToDomain(entity: SaleDetailTypeOrmEntity): SaleDetail {
    return new SaleDetail({
      id: entity.id,
      saleId: entity.saleId,
      productId: entity.productId,
      productName: entity.productNameSnapshot,
      productCode: entity.productCodeSnapshot,
      quantity: Number(entity.quantity),
      unitPrice: Number(entity.unitPrice),
      createdAt: entity.createdAt,
    });
  }

  private mapToEntity(detail: SaleDetail): Partial<SaleDetailTypeOrmEntity> {
    return {
      saleId: detail.saleId,
      productId: detail.productId,
      productNameSnapshot: detail.productName,
      productCodeSnapshot: detail.productCode,
      quantity: detail.quantity,
      unitPrice: detail.unitPrice,
    };
  }

  async findById(id: number): Promise<SaleDetail | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? this.mapToDomain(entity) : null;
  }

  async findBySaleId(saleId: string): Promise<SaleDetail[]> {
    const entities = await this.repo.find({ where: { saleId } });
    return entities.map((e) => this.mapToDomain(e));
  }

  async create(detail: SaleDetail): Promise<SaleDetail> {
    const entity = this.repo.create(this.mapToEntity(detail) as SaleDetailTypeOrmEntity);
    const saved = await this.repo.save(entity);
    return this.mapToDomain(saved);
  }

  async update(detail: SaleDetail): Promise<SaleDetail> {
    await this.repo.update(detail.id, this.mapToEntity(detail) as any);
    const updated = await this.repo.findOne({ where: { id: detail.id } });
    if (!updated) throw new Error('SaleDetail not found after update');
    return this.mapToDomain(updated);
  }

  async deleteBySaleId(saleId: string): Promise<void> {
    await this.repo.delete({ saleId });
  }
}
