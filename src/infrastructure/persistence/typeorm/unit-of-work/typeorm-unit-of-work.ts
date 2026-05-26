/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { DataSource, QueryRunner } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { IUnitOfWork } from '../../../../application/unit-of-work/unit-of-work.interface';
import type {
  ISaleRepository,
  ISaleDetailRepository,
  IProductRepository,
  IStockMovementRepository,
} from '../../../../domain/repositories';
import { SaleRepositoryImpl } from '../repositories/sale.repository.impl';
import { SaleDetailRepositoryImpl } from '../repositories/sale-detail.repository.impl';
import { ProductRepositoryImpl } from '../repositories/product.repository.impl';
import { StockMovementRepositoryImpl } from '../repositories/stock-movement.repository.impl';

@Injectable()
export class TypeOrmUnitOfWork implements IUnitOfWork {
  private queryRunner!: QueryRunner;
  private started = false;
  private pendingEvents: any[] = [];

  constructor(
    private readonly dataSource: DataSource,
    private readonly eventBus: EventBus,
  ) {}

  async start(): Promise<void> {
    if (!this.started) {
      this.queryRunner = this.dataSource.createQueryRunner();
      await this.queryRunner.connect();
      await this.queryRunner.startTransaction();
      this.started = true;
    }
  }

  async commit(): Promise<void> {
    if (this.started) {
      await this.queryRunner.commitTransaction();
      for (const event of this.pendingEvents) {
        this.eventBus.publish(event);
      }
      this.pendingEvents = [];
      this.started = false;
    }
  }

  async rollback(): Promise<void> {
    if (!this.started) return;
    await this.queryRunner.rollbackTransaction();
    this.pendingEvents = [];
    this.started = false;
  }

  dispatchEvent(event: any): void {
    // Publish event immediately via EventBus
    // (pendingEvents queue is kept for potential transaction-based scenarios)
    this.eventBus.publish(event);
  }

  get sales(): ISaleRepository {
    if (!this.started) {
      throw new Error('UnitOfWork not started. Call start() first.');
    }
    return new SaleRepositoryImpl(this.queryRunner);
  }

  get saleDetails(): ISaleDetailRepository {
    if (!this.started) {
      throw new Error('UnitOfWork not started. Call start() first.');
    }
    return new SaleDetailRepositoryImpl(this.queryRunner);
  }

  get products(): IProductRepository {
    if (!this.started) {
      throw new Error('UnitOfWork not started. Call start() first.');
    }
    return new ProductRepositoryImpl(this.queryRunner);
  }

  get stockMovements(): IStockMovementRepository {
    if (!this.started) {
      throw new Error('UnitOfWork not started. Call start() first.');
    }
    return new StockMovementRepositoryImpl(this.queryRunner);
  }
}