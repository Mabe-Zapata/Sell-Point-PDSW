/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { getPgPool } from '../base/pg-pool';
import {
  IDashboardQueryService,
  DashboardStats,
} from '../../../domain/query-services/dashboard.query-service.interface';

@Injectable()
export class DashboardQueryService implements IDashboardQueryService {
  private readonly pool: Pool;

  constructor(private readonly configService: ConfigService) {
    this.pool = getPgPool(configService);
  }

  async getStats(branchId?: string): Promise<DashboardStats> {
    const query = `
      SELECT
        COALESCE(SUM(sal.tot_sal), 0)::numeric AS total_revenue,
        COUNT(sal.id)::integer AS total_sales,
        COALESCE(SUM(sal.tot_sal) FILTER (WHERE DATE(sal.cre_at) = CURRENT_DATE), 0)::numeric AS today_revenue,
        COUNT(sal.id) FILTER (WHERE DATE(sal.cre_at) = CURRENT_DATE)::integer AS today_sales
      FROM sales sal
      WHERE ($1::uuid IS NULL OR sal.bra_id = $1)
        AND sal.sta_sal = 'CONFIRMED';
    `;

    const result = await this.pool.query(query, [branchId ?? null]);
    const row = result.rows[0];

    const customerCountResult = await this.pool.query(
      'SELECT COUNT(*)::integer AS total FROM customers',
    );

    const productCountResult = await this.pool.query(
      'SELECT COUNT(*)::integer AS total FROM products WHERE act_pro = true',
    );

    return {
      totalSales: Number(row.total_sales),
      totalRevenue: Number(row.total_revenue),
      totalCustomers: Number(customerCountResult.rows[0].total),
      totalProducts: Number(productCountResult.rows[0].total),
      salesByBranch: [],
      topProducts: [],
      recentSales: [],
    };
  }
}