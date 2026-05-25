/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { DataSource, QueryRunner } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { IUnitOfWork } from './unit-of-work.interface';
import type {
  ISaleRepository,
  ISaleDetailRepository,
  IProductRepository,
  IStockMovementRepository,
} from '../../domain/repositories';
import { Sale, SaleDetail, Product, StockMovement } from '../../domain/entities';
import { SaleStatusMapper } from '../../infrastructure/database/entities/enums/sale-status.db-enum';
import { StockMovementTypeMapper } from '../../infrastructure/database/entities/enums/stock-movement-type.db-enum';

@Injectable()
export class TypeOrmUnitOfWork implements IUnitOfWork {
  private queryRunner!: QueryRunner;
  private started = false;
  private pendingEvents: any[] = [];

  constructor(private readonly dataSource: DataSource) {}

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
        console.info('Event dispatched:', event);
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
    this.pendingEvents.push(event);
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

// Transaction-scoped repository implementations
// These use the QueryRunner's manager to participate in the same transaction

class SaleRepositoryImpl implements ISaleRepository {
  constructor(private readonly qr: QueryRunner) {}

  async findById(id: string): Promise<Sale | null> {
    const entity = await this.qr.manager.findOne('SaleTypeOrmEntity', { where: { id } });
    return entity ? this.mapToDomain(entity) : null;
  }

  async findBySaleNumber(saleNumber: string): Promise<Sale | null> {
    const entity = await this.qr.manager.findOne('SaleTypeOrmEntity', { where: { saleNumber } });
    return entity ? this.mapToDomain(entity) : null;
  }

  async findAll(pagination?: any, filters?: any): Promise<any> {
    const queryBuilder = this.qr.manager
      .createQueryBuilder('SaleTypeOrmEntity', 'sale')
      .skip((pagination.page - 1) * pagination.limit)
      .take(pagination.limit);

    if (filters?.branchId) queryBuilder.andWhere('sale.branchId = :branchId', { branchId: filters.branchId });
    if (filters?.customerId) queryBuilder.andWhere('sale.customerId = :customerId', { customerId: filters.customerId });
    if (filters?.cashierUserId) queryBuilder.andWhere('sale.cashierUserId = :cashierUserId', { cashierUserId: filters.cashierUserId });
    if (filters?.status) queryBuilder.andWhere('sale.status = :status', { status: filters.status });

    const [entities, total] = await queryBuilder.getManyAndCount();
    return {
      data: entities.map((e: any) => this.mapToDomain(e)),
      total,
      page: pagination.page,
      limit: pagination.limit,
    };
  }

  async create(sale: Sale): Promise<Sale> {
    const entity = this.qr.manager.create('SaleTypeOrmEntity', this.mapToEntity(sale));
    const saved = await this.qr.manager.save('SaleTypeOrmEntity', entity);
    return this.mapToDomain(saved);
  }

  async update(sale: Sale): Promise<Sale> {
    await this.qr.manager.update('SaleTypeOrmEntity', sale.id, this.mapToEntity(sale));
    const updated = await this.qr.manager.findOne('SaleTypeOrmEntity', { where: { id: sale.id } });
    if (!updated) throw new Error('Sale not found after update');
    return this.mapToDomain(updated);
  }

  async findByIdWithDetails(id: string): Promise<Sale | null> {
    // Use pessimistic write lock on sale
    const saleEntity = await this.qr.manager
      .createQueryBuilder('SaleTypeOrmEntity', 'sale')
      .where('sale.id = :id', { id })
      .setLock('pessimistic_write')
      .getOne();

    if (!saleEntity) return null;

    // Load sale details
    const detailEntities = await this.qr.manager
      .createQueryBuilder('SaleDetailTypeOrmEntity', 'sd')
      .where('sd.saleId = :saleId', { saleId: id })
      .getMany();

    const sale = this.mapToDomain(saleEntity);
    sale.details = detailEntities.map((e: any) => this.mapDetailToDomain(e));
    return sale;
  }

  private mapToDomain(entity: any): Sale {
    return new Sale({
      id: entity.id,
      branchId: entity.branchId,
      customerId: entity.customerId,
      cashierUserId: entity.cashierUserId,
      taxRateId: entity.taxRateId,
      saleNumber: entity.saleNumber,
      status: SaleStatusMapper.toDomain(entity.status),
      subtotal: Number(entity.subtotal),
      taxAmount: Number(entity.taxAmount),
      discountAmount: Number(entity.discountAmount),
      total: Number(entity.total),
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  private mapToEntity(sale: Sale): any {
    return {
      branchId: sale.branchId,
      customerId: sale.customerId,
      cashierUserId: sale.cashierUserId,
      taxRateId: sale.taxRateId,
      saleNumber: sale.saleNumber,
      status: SaleStatusMapper.toDb(sale.status),
      subtotal: sale.subtotal,
      taxAmount: sale.taxAmount,
      discountAmount: sale.discountAmount,
      total: sale.total,
    };
  }

  private mapDetailToDomain(entity: any): SaleDetail {
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
}

class SaleDetailRepositoryImpl implements ISaleDetailRepository {
  constructor(private readonly qr: QueryRunner) {}

  async findById(id: string): Promise<SaleDetail | null> {
    const entity = await this.qr.manager.findOne('SaleDetailTypeOrmEntity', { where: { id } });
    return entity ? this.mapToDomain(entity) : null;
  }

  async findBySaleId(saleId: string): Promise<SaleDetail[]> {
    const entities = await this.qr.manager.find('SaleDetailTypeOrmEntity', { where: { saleId } });
    return entities.map((e: any) => this.mapToDomain(e));
  }

  async findAll(pagination?: any, filters?: any): Promise<any> {
    const queryBuilder = this.qr.manager
      .createQueryBuilder('SaleDetailTypeOrmEntity', 'sd')
      .skip((pagination.page - 1) * pagination.limit)
      .take(pagination.limit);

    if (filters?.saleId) queryBuilder.andWhere('sd.saleId = :saleId', { saleId: filters.saleId });
    if (filters?.productId) queryBuilder.andWhere('sd.productId = :productId', { productId: filters.productId });

    const [entities, total] = await queryBuilder.getManyAndCount();
    return {
      data: entities.map((e: any) => this.mapToDomain(e)),
      total,
      page: pagination.page,
      limit: pagination.limit,
    };
  }

  async create(detail: SaleDetail): Promise<SaleDetail> {
    const entity = this.qr.manager.create('SaleDetailTypeOrmEntity', this.mapToEntity(detail));
    const saved = await this.qr.manager.save('SaleDetailTypeOrmEntity', entity);
    return this.mapToDomain(saved);
  }

  async update(detail: SaleDetail): Promise<SaleDetail> {
    await this.qr.manager.update('SaleDetailTypeOrmEntity', detail.id, this.mapToEntity(detail));
    const updated = await this.qr.manager.findOne('SaleDetailTypeOrmEntity', { where: { id: detail.id } });
    if (!updated) throw new Error('SaleDetail not found after update');
    return this.mapToDomain(updated);
  }

  async deleteBySaleId(saleId: string): Promise<void> {
    await this.qr.manager.delete('SaleDetailTypeOrmEntity', { saleId });
  }

  private mapToDomain(entity: any): SaleDetail {
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

  private mapToEntity(detail: SaleDetail): any {
    return {
      saleId: detail.saleId,
      productId: detail.productId,
      productNameSnapshot: detail.productName,
      productCodeSnapshot: detail.productCode,
      quantity: detail.quantity,
      unitPrice: detail.unitPrice,
    };
  }
}

class ProductRepositoryImpl implements IProductRepository {
  constructor(private readonly qr: QueryRunner) {}

  async findById(id: string): Promise<Product | null> {
    const entity = await this.qr.manager.findOne('ProductTypeOrmEntity', { where: { id } });
    return entity ? this.mapToDomain(entity) : null;
  }

  async findByCode(code: string): Promise<Product | null> {
    const entity = await this.qr.manager.findOne('ProductTypeOrmEntity', { where: { code } });
    return entity ? this.mapToDomain(entity) : null;
  }

  async findAll(pagination?: any, filters?: any): Promise<any> {
    const queryBuilder = this.qr.manager
      .createQueryBuilder('ProductTypeOrmEntity', 'product')
      .skip((pagination.page - 1) * pagination.limit)
      .take(pagination.limit);

    if (filters?.categoryId) queryBuilder.andWhere('product.categoryId = :categoryId', { categoryId: filters.categoryId });
    if (filters?.isActive !== undefined) queryBuilder.andWhere('product.isActive = :isActive', { isActive: filters.isActive });

    const [entities, total] = await queryBuilder.getManyAndCount();
    return {
      data: entities.map((e: any) => this.mapToDomain(e)),
      total,
      page: pagination.page,
      limit: pagination.limit,
    };
  }

  async create(product: Product): Promise<Product> {
    const entity = this.qr.manager.create('ProductTypeOrmEntity', this.mapToEntity(product));
    const saved = await this.qr.manager.save('ProductTypeOrmEntity', entity);
    return this.mapToDomain(saved);
  }

  async update(product: Product): Promise<Product> {
    await this.qr.manager.update('ProductTypeOrmEntity', product.id, this.mapToEntity(product));
    const updated = await this.qr.manager.findOne('ProductTypeOrmEntity', { where: { id: product.id } });
    if (!updated) throw new Error('Product not found after update');
    return this.mapToDomain(updated);
  }

  async softDelete(id: string): Promise<void> {
    await this.qr.manager.delete('ProductTypeOrmEntity', { id });
  }

  async findByIdForUpdate(id: string): Promise<Product | null> {
    const entity = await this.qr.manager
      .createQueryBuilder('ProductTypeOrmEntity', 'product')
      .where('product.id = :id', { id })
      .setLock('pessimistic_write')
      .getOne();
    return entity ? this.mapToDomain(entity) : null;
  }

  private mapToDomain(entity: any): Product {
    return new Product({
      id: String(entity.id),
      categoryId: entity.categoryId,
      code: entity.code,
      name: entity.name,
      description: entity.description,
      salePrice: Number(entity.salePrice),
      costPrice: Number(entity.costPrice),
      isActive: entity.isActive,
      currentStock: entity.availableQuantity ?? 0,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  private mapToEntity(product: Product): any {
    return {
      categoryId: product.categoryId,
      code: product.code,
      name: product.name,
      description: product.description,
      salePrice: product.salePrice,
      costPrice: product.costPrice,
      isActive: product.isActive,
      availableQuantity: product.currentStock,
    };
  }
}

class StockMovementRepositoryImpl implements IStockMovementRepository {
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
