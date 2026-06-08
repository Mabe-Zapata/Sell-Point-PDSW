/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { LOW_STOCK_THRESHOLD } from '../../../domain/constants/inventory.constants';
import {
  DashboardStats,
  IDashboardQueryService,
} from '../../../domain/query-services/dashboard.query-service.interface';
import { InvoiceTypeOrmEntity } from '../../database/entities/invoice.typeorm.entity';
import { ProductTypeOrmEntity } from '../../database/entities/product.typeorm.entity';
import { SaleTypeOrmEntity } from '../../database/entities/sale.typeorm.entity';

@Injectable()
export class DashboardQueryService implements IDashboardQueryService {
  constructor(
    @InjectRepository(SaleTypeOrmEntity)
    private readonly saleRepository: Repository<SaleTypeOrmEntity>,
    @InjectRepository(InvoiceTypeOrmEntity)
    private readonly invoiceRepository: Repository<InvoiceTypeOrmEntity>,
    @InjectRepository(ProductTypeOrmEntity)
    private readonly productRepository: Repository<ProductTypeOrmEntity>,
  ) {}

  async getStats(branchId?: string): Promise<DashboardStats> {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const startOfTomorrow = new Date(startOfToday);
    startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const [ventasDelDia, ventasDelMes, totalFacturas, productosConStockBajo] = await Promise.all([
      this.sumSalesBetween(startOfToday, startOfTomorrow, branchId),
      this.sumSalesBetween(startOfMonth, startOfNextMonth, branchId),
      this.countInvoices(branchId),
      this.countLowStockProducts(),
    ]);

    return {
      ventasDelDia,
      ventasDelMes,
      totalFacturas,
      productosConStockBajo,
    };
  }

  private async sumSalesBetween(start: Date, end: Date, branchId?: string): Promise<number> {
    const query = this.saleRepository
      .createQueryBuilder('sale')
      .select('COALESCE(SUM(sale.total), 0)', 'total')
      .where('sale.status = :status', { status: 'CONFIRMED' })
      .andWhere('sale.createdAt >= :start', { start })
      .andWhere('sale.createdAt < :end', { end });

    if (branchId) {
      query.andWhere('sale.branchId = :branchId', { branchId });
    }

    const result = await query.getRawOne();
    return Number(result?.total) || 0;
  }

  private async countInvoices(branchId?: string): Promise<number> {
    const query = this.invoiceRepository
      .createQueryBuilder('invoice')
      .innerJoin(SaleTypeOrmEntity, 'sale', 'sale.id = invoice.saleId')
      .select('COUNT(invoice.id)', 'total');

    if (branchId) {
      query.where('sale.branchId = :branchId', { branchId });
    }

    const result = await query.getRawOne();
    return Number(result?.total) || 0;
  }

  private async countLowStockProducts(): Promise<number> {
    const result = await this.productRepository
      .createQueryBuilder('product')
      .select('COUNT(product.id)', 'total')
      .where('product.deletedAt IS NULL')
      .andWhere('product.currentStock < :threshold', { threshold: LOW_STOCK_THRESHOLD })
      .getRawOne();

    return Number(result?.total) || 0;
  }
}
