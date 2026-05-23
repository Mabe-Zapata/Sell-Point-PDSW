/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerTypeOrmEntity } from '../database/entities/customer.typeorm.entity';
import { Customer } from '../../domain/entities/customer.entity';
import { ICustomerRepository, CustomerFilters } from '../../domain/repositories/customer.repository.interface';
import { PaginationParams, PaginatedResult } from '../../domain/repositories/pagination.types';

@Injectable()
export class CustomerRepository implements ICustomerRepository {
  constructor(
    @InjectRepository(CustomerTypeOrmEntity)
    private readonly repo: Repository<CustomerTypeOrmEntity>,
  ) {}

  private mapToDomain(entity: CustomerTypeOrmEntity): Customer {
    return new Customer({
      id: entity.id,
      names: entity.names,
      lastName: entity.lastName,
      email: entity.email,
      phone: entity.phone,
      address: entity.address,
      isActive: entity.isActive,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  private mapToEntity(customer: Customer): Partial<CustomerTypeOrmEntity> {
    return {
      names: customer.names,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      isActive: customer.isActive,
    };
  }

  async findById(id: string): Promise<Customer | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? this.mapToDomain(entity) : null;
  }

  async findByIdentificationNumber(cedula: string): Promise<Customer | null> {
    const entity = await this.repo.findOne({ where: { cedula } });
    return entity ? this.mapToDomain(entity) : null;
  }

  async findAll(
    pagination: PaginationParams = { page: 1, limit: 20 },
    filters: CustomerFilters = {},
  ): Promise<PaginatedResult<Customer>> {
    const { page, limit } = pagination;
    const { q } = filters;

    const queryBuilder = this.repo.createQueryBuilder('customer');

    if (q) {
      queryBuilder.where('customer.names ILIKE :q OR customer.cedula ILIKE :q', { q: `%${q}%` });
    }

    const total = await queryBuilder.getCount();
    queryBuilder.skip((page - 1) * limit).take(limit);
    queryBuilder.orderBy('customer.createdAt', 'DESC');

    const entities = await queryBuilder.getMany();

    return {
      data: entities.map((e) => this.mapToDomain(e)),
      total,
      page,
      limit,
    };
  }

  async create(customer: Customer): Promise<Customer> {
    const entity = this.repo.create(this.mapToEntity(customer) as CustomerTypeOrmEntity);
    const saved = await this.repo.save(entity);
    return this.mapToDomain(saved);
  }

  async update(customer: Customer): Promise<Customer> {
    await this.repo.update(customer.id, this.mapToEntity(customer) as any);
    const updated = await this.repo.findOne({ where: { id: customer.id } });
    if (!updated) throw new Error('Customer not found after update');
    return this.mapToDomain(updated);
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}