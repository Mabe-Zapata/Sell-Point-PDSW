/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  IDashboardQueryService,
  DashboardStats,
} from '../../../domain/query-services/dashboard.query-service.interface';
import { SaleTypeOrmEntity } from '../../database/entities/sale.typeorm.entity';
import { CustomerTypeOrmEntity } from '../../database/entities/customer.typeorm.entity';
import { ProductTypeOrmEntity } from '../../database/entities/product.typeorm.entity';

@Injectable()
export class DashboardQueryService implements IDashboardQueryService {
  constructor(
    @InjectRepository(SaleTypeOrmEntity)
    private readonly saleRepository: Repository<SaleTypeOrmEntity>,
    @InjectRepository(CustomerTypeOrmEntity)
    private readonly customerRepository: Repository<CustomerTypeOrmEntity>,
    @InjectRepository(ProductTypeOrmEntity)
    private readonly productRepository: Repository<ProductTypeOrmEntity>,
  ) {}

  async getStats(branchId?: string): Promise<DashboardStats> {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const startOfTomorrow = new Date(startOfToday);
    startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

    const totalsQuery = this.saleRepository
      .createQueryBuilder('sal')
      .select('COALESCE(SUM(sal.total), 0)', 'totalRevenue')
      .addSelect('COUNT(sal.id)', 'totalSales')
      .addSelect(
        'COALESCE(SUM(CASE WHEN sal.createdAt >= :startOfToday AND sal.createdAt < :startOfTomorrow THEN sal.total ELSE 0 END), 0)',
        'todayRevenue',
      )
      .addSelect(
        'SUM(CASE WHEN sal.createdAt >= :startOfToday AND sal.createdAt < :startOfTomorrow THEN 1 ELSE 0 END)',
        'todaySales',
      )
      .where(branchId ? 'sal.branchId = :branchId' : '1=1', { branchId })
      .andWhere('sal.status = :status', { status: 'CONFIRMED' })
      .setParameters({ startOfToday, startOfTomorrow });

    const [salesTotals, customerCountResult, productCountResult] = await Promise.all([
      totalsQuery.getRawOne(),
      this.customerRepository.createQueryBuilder('customer').select('COUNT(customer.id)', 'total').getRawOne(),
      this.productRepository
        .createQueryBuilder('product')
        .select('COUNT(product.id)', 'total')
        .where('product.isActive = :isActive', { isActive: true })
        .getRawOne(),
    ]);

    return {
      totalSales: Number(salesTotals?.totalSales) || 0,
      totalRevenue: Number(salesTotals?.totalRevenue) || 0,
      totalCustomers: Number(customerCountResult?.total) || 0,
      totalProducts: Number(productCountResult?.total) || 0,
      salesByBranch: [],
      topProducts: [],
      recentSales: [],
    };
  }
}
