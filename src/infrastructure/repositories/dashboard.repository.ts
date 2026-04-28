/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerTypeOrmEntity } from '../database/entities/customer.typeorm.entity';
import { ProductTypeOrmEntity } from '../database/entities/product.typeorm.entity';
import { InvoiceTypeOrmEntity } from '../database/entities/invoice.typeorm.entity';
import { IDashboardRepository } from '../../domain/repositories/dashboard.repository.interface';

@Injectable()
export class DashboardRepository implements IDashboardRepository {
  constructor(
    @InjectRepository(CustomerTypeOrmEntity)
    private readonly customerRepository: Repository<CustomerTypeOrmEntity>,
    @InjectRepository(ProductTypeOrmEntity)
    private readonly productRepository: Repository<ProductTypeOrmEntity>,
    @InjectRepository(InvoiceTypeOrmEntity)
    private readonly invoiceRepository: Repository<InvoiceTypeOrmEntity>,
  ) {}

  async countActiveCustomers(): Promise<number> {
    return this.customerRepository
      .createQueryBuilder('customer')
      .where('customer.deletedAt IS NULL')
      .getCount();
  }

  async countActiveProducts(): Promise<number> {
    return this.productRepository
      .createQueryBuilder('product')
      .where('product.deletedAt IS NULL')
      .getCount();
  }

  async countActiveInvoices(): Promise<number> {
    return this.invoiceRepository
      .createQueryBuilder('invoice')
      .where('invoice.deletedAt IS NULL')
      .getCount();
  }

  async sumSalesByDate(date: Date): Promise<number> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const result = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .select('SUM(invoice.total)', 'total')
      .where('invoice.deletedAt IS NULL')
      .andWhere('invoice.invoiceDate >= :startOfDay', { startOfDay })
      .andWhere('invoice.invoiceDate <= :endOfDay', { endOfDay })
      .getRawOne();

    return Number(result?.total) || 0;
  }

  async sumSalesByMonth(year: number, month: number): Promise<number> {
    const result = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .select('SUM(invoice.total)', 'total')
      .where('invoice.deletedAt IS NULL')
      .andWhere('YEAR(invoice.invoiceDate) = :year', { year })
      .andWhere('MONTH(invoice.invoiceDate) = :month', { month })
      .getRawOne();

    return Number(result?.total) || 0;
  }

  async countProductsWithLowStock(): Promise<number> {
    const result = await this.productRepository
      .createQueryBuilder('product')
      .where('product.deletedAt IS NULL')
      .andWhere('product.availableQuantity < 10')
      .getCount();

    return result;
  }
}
