import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerTypeOrmEntity } from '../database/entities/customer.typeorm.entity';
import { Customer } from '../../domain/entities/customer.entity';
import {
  ICustomerRepository,
  PaginationParams,
  CustomerFilters,
  PaginatedResult,
} from '../../domain/repositories/customer.repository.interface';

@Injectable()
export class CustomerRepository implements ICustomerRepository {
  constructor(
    @InjectRepository(CustomerTypeOrmEntity)
    private readonly customerRepository: Repository<CustomerTypeOrmEntity>,
  ) {}

  private mapToDomain(entity: CustomerTypeOrmEntity): Customer {
    return new Customer({
      id: entity.id,
      name: entity.name,
      lastName: entity.lastName,
      cedula: entity.cedula,
      email: entity.email ?? undefined,
      phone: entity.phone ?? undefined,
      address: entity.address ?? undefined,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt ?? undefined,
    });
  }

  async findById(id: string): Promise<Customer | null> {
    const entity = await this.customerRepository.findOne({
      where: { id },
      withDeleted: false,
    });
    return entity ? this.mapToDomain(entity) : null;
  }

  async findByCedula(cedula: string): Promise<Customer | null> {
    const entity = await this.customerRepository.findOne({
      where: { cedula },
      withDeleted: false,
    });
    return entity ? this.mapToDomain(entity) : null;
  }

  async findAll(
    pagination: PaginationParams = { page: 1, limit: 20 },
    filters: CustomerFilters = {},
  ): Promise<PaginatedResult<Customer>> {
    const { page, limit } = pagination;
    const { q } = filters;

    const queryBuilder = this.customerRepository.createQueryBuilder('customer');

    // Apply search filter if provided
    if (q) {
      queryBuilder.where(
        '(customer.name LIKE :q OR customer.lastName LIKE :q OR customer.cedula LIKE :q)',
        { q: `%${q}%` },
      );
    }

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Order by creation date descending
    queryBuilder.orderBy('customer.createdAt', 'DESC');

    const entities = await queryBuilder.getMany();

    return {
      data: entities.map((entity) => this.mapToDomain(entity)),
      total,
      page,
      limit,
    };
  }

  async create(customer: Customer): Promise<Customer> {
    const entity = this.customerRepository.create({
      name: customer.name,
      lastName: customer.lastName,
      cedula: customer.cedula,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
    });

    const saved = await this.customerRepository.save(entity);
    return this.mapToDomain(saved);
  }

  async update(customer: Customer): Promise<Customer> {
    await this.customerRepository.update(customer.id, {
      name: customer.name,
      lastName: customer.lastName,
      cedula: customer.cedula,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
    });

    const updated = await this.customerRepository.findOne({
      where: { id: customer.id },
    });

    if (!updated) {
      throw new Error('Customer not found after update');
    }

    return this.mapToDomain(updated);
  }

  async softDelete(id: string): Promise<void> {
    await this.customerRepository.softDelete(id);
  }
}
