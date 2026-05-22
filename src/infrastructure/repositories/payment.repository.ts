import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentTypeOrmEntity } from '../database/entities/payment.typeorm.entity';
import { Payment } from '../../domain/entities/payment.entity';
import { PaymentMethodMapper } from '../database/entities/enums/payment-method.db-enum';
import { IPaymentRepository } from '../../domain/repositories/payment.repository.interface';
import { PaginationParams, PaginatedResult } from '../../domain/repositories/pagination.types';
import { PaymentFilters } from '../../domain/repositories/payment.repository.interface';

@Injectable()
export class PaymentRepository {
  constructor(
    @InjectRepository(PaymentTypeOrmEntity)
    private readonly repo: Repository<PaymentTypeOrmEntity>,
  ) {}

  private mapToDomain(entity: PaymentTypeOrmEntity): Payment {
    return new Payment({
      id: entity.id,
      saleId: entity.saleId,
      method: PaymentMethodMapper.toDomain(entity.method),
      amount: Number(entity.amount),
      reference: entity.reference,
      paidAt: entity.paidAt,
      createdAt: entity.createdAt,
    });
  }

  private mapToEntity(payment: Payment): Partial<PaymentTypeOrmEntity> {
    return {
      saleId: payment.saleId,
      method: PaymentMethodMapper.toDb(payment.method),
      amount: payment.amount,
      reference: payment.reference,
      paidAt: payment.paidAt,
    };
  }

  async findById(id: string): Promise<Payment | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? this.mapToDomain(entity) : null;
  }

  async findBySaleId(saleId: string): Promise<Payment[]> {
    const entities = await this.repo.find({ where: { saleId } });
    return entities.map((e) => this.mapToDomain(e));
  }

  async findAll(
    pagination: PaginationParams = { page: 1, limit: 20 },
    filters: PaymentFilters = {},
  ): Promise<PaginatedResult<Payment>> {
    const { page, limit } = pagination;
    const { saleId, method } = filters;

    const queryBuilder = this.repo.createQueryBuilder('payment');

    if (saleId) {
      queryBuilder.andWhere('payment.saleId = :saleId', { saleId });
    }
    if (method) {
      queryBuilder.andWhere('payment.method = :method', { method });
    }

    const total = await queryBuilder.getCount();
    queryBuilder.skip((page - 1) * limit).take(limit);
    queryBuilder.orderBy('payment.createdAt', 'DESC');

    const entities = await queryBuilder.getMany();

    return {
      data: entities.map((e) => this.mapToDomain(e)),
      total,
      page,
      limit,
    };
  }

  async create(payment: Payment): Promise<Payment> {
    const entity = this.repo.create(this.mapToEntity(payment) as PaymentTypeOrmEntity);
    const saved = await this.repo.save(entity);
    return this.mapToDomain(saved);
  }
}
