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
        COALESCE(SUM(sal."TOT_SAL"), 0)::numeric AS total_revenue,
        COUNT(sal.id)::integer AS total_sales,
        COALESCE(SUM(sal."TOT_SAL") FILTER (WHERE DATE(sal."CRE_AT") = CURRENT_DATE), 0)::numeric AS today_revenue,
        COUNT(sal.id) FILTER (WHERE DATE(sal."CRE_AT") = CURRENT_DATE)::integer AS today_sales
      FROM "SALES" sal
      WHERE ($1::uuid IS NULL OR sal."BRA_ID" = $1)
        AND sal."STA_SAL" = 'CONFIRMED';
    `;

    const result = await this.pool.query(query, [branchId ?? null]);
    const row = result.rows[0];

    const customerCountResult = await this.pool.query(
      'SELECT COUNT(*)::integer AS total FROM "CUSTOMERS"',
    );

    const productCountResult = await this.pool.query(
      'SELECT COUNT(*)::integer AS total FROM "PRODUCTS" WHERE "ACT_PRO" = true',
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