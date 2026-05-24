/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CustomerListItem,
  ICustomerQueryService,
} from '../../../domain/query-services/customer.query-service.interface';
import { Customer } from '../../../domain/entities/customer.entity';
import { CustomerTypeOrmEntity } from '../../database/entities/customer.typeorm.entity';

@Injectable()
export class CustomerQueryService implements ICustomerQueryService {
  constructor(
    @InjectRepository(CustomerTypeOrmEntity)
    private readonly customerRepository: Repository<CustomerTypeOrmEntity>,
  ) {}

  async listCustomers(params: {
    page: number;
    limit: number;
    q?: string;
    cedula?: string;
  }): Promise<{ data: CustomerListItem[]; total: number; page: number; limit: number }> {
    const { page, limit, q, cedula } = params;
    const offset = (page - 1) * limit;
    const searchPattern = q ? `%${q}%` : null;

    const queryBuilder = this.customerRepository
      .createQueryBuilder('customer')
      .where(
        q
          ? '(LOWER(customer.firstName) LIKE LOWER(:search) OR LOWER(customer.lastName) LIKE LOWER(:search) OR LOWER(customer.cedula) LIKE LOWER(:search))'
          : '1=1',
        { search: searchPattern },
      )
      .andWhere(cedula ? 'customer.cedula = :cedula' : '1=1', { cedula })
      .orderBy('customer.createdAt', 'DESC')
      .skip(offset)
      .take(limit);

    const [rows, total] = await queryBuilder.getManyAndCount();

    return {
      data: rows.map((row): CustomerListItem => ({
        id: row.id,
        cedula: row.cedula ?? '',
        firstName: row.firstName,
        lastName: row.lastName ?? '',
        email: row.email ?? null,
        phone: row.phone ?? null,
        address: row.address ?? null,
        isActive: row.isActive,
        createdAt: row.createdAt,
      })),
      total,
      page,
      limit,
    };
  }

  async getCustomerByIdentification(cedula: string): Promise<Customer | null> {
    const customer = await this.customerRepository.findOne({
      where: { cedula },
    });

    if (!customer) {
      return null;
    }

    return new Customer({
      id: customer.id,
      cedula: customer.cedula,
      firstName: customer.firstName,
      lastName: customer.lastName ?? undefined,
      email: customer.email ?? undefined,
      phone: customer.phone ?? undefined,
      address: customer.address ?? undefined,
      isActive: customer.isActive,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
    });
  }
}
