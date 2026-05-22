/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { getPgPool } from '../base/pg-pool';
import {
  IProductQueryService,
  ProductListItem,
} from '../../../domain/query-services/product.query-service.interface';

interface ProductRow {
  id: string;
  code: string;
  name: string;
  salePrice: number | string;
  costPrice: number | string;
  currentStock: number | string;
  categoryId: string;
  categoryName: string;
  isActive: boolean;
}

interface ProductWarehouseStockRow {
  warehouseId: string;
  warehouseName: string;
  currentStock: number | string;
}

@Injectable()
export class ProductQueryService implements IProductQueryService {
  private readonly pool: Pool;

  constructor(private readonly configService: ConfigService) {
    this.pool = getPgPool(configService);
  }

  async listProducts(params: {
    page: number;
    limit: number;
    q?: string;
    categoryId?: string;
    isActive?: boolean;
  }): Promise<{ data: ProductListItem[]; total: number; page: number; limit: number }> {
    const { page, limit, q, categoryId, isActive } = params;
    const offset = (page - 1) * limit;

    const searchPattern = q ? `%${q}%` : null;

    const countQuery = `
      SELECT COUNT(*)::integer AS total
      FROM products p
      LEFT JOIN inventories i ON i.pro_id = p.id
      WHERE ($1::varchar IS NULL OR p.nam_pro ILIKE $1 OR p.cod_pro ILIKE $1)
        AND ($2::uuid IS NULL OR p.cat_id = $2)
        AND ($3::boolean IS NULL OR p.act_pro = $3);
    `;

    const listQuery = `
      SELECT
        p.id,
        p.cod_pro AS "code",
        p.nam_pro AS "name",
        p.sal_pri_pro AS "salePrice",
        p.cos_pri_pro AS "costPrice",
        COALESCE(SUM(i.cur_sto), 0) AS "currentStock",
        p.act_pro AS "isActive",
        p.cat_id AS "categoryId",
        c.nam_cat AS "categoryName"
      FROM products p
      LEFT JOIN categories c ON p.cat_id = c.id
      LEFT JOIN inventories i ON i.pro_id = p.id
      WHERE ($1::varchar IS NULL OR p.nam_pro ILIKE $1 OR p.cod_pro ILIKE $1)
        AND ($2::uuid IS NULL OR p.cat_id = $2)
        AND ($3::boolean IS NULL OR p.act_pro = $3)
      GROUP BY p.id, p.cod_pro, p.nam_pro, p.sal_pri_pro, p.cos_pri_pro, p.act_pro, p.cat_id, c.nam_cat, p.cre_at
      ORDER BY p.cre_at DESC
      LIMIT $4 OFFSET $5;
    `;

    const [countResult, listResult] = await Promise.all([
      this.pool.query(countQuery, [searchPattern, categoryId ?? null, isActive ?? null]),
      this.pool.query<ProductRow>(listQuery, [searchPattern, categoryId ?? null, isActive ?? null, limit, offset]),
    ]);

    return {
      data: listResult.rows.map((row) => ({
        id: row.id,
        code: row.code,
        name: row.name,
        salePrice: Number(row.salePrice),
        costPrice: Number(row.costPrice),
        currentStock: Number(row.currentStock),
        categoryId: row.categoryId,
        categoryName: row.categoryName,
        isActive: row.isActive,
      })),
      total: Number(countResult.rows[0].total),
      page,
      limit,
    };
  }

  async getProductWithStock(id: string): Promise<(ProductListItem & { warehouseStock: { warehouseId: string; warehouseName: string; currentStock: number }[] }) | null> {
    const productQuery = `
      SELECT
        p.id,
        p.cod_pro AS "code",
        p.nam_pro AS "name",
        p.sal_pri_pro AS "salePrice",
        p.cos_pri_pro AS "costPrice",
        COALESCE(SUM(i.cur_sto), 0) AS "currentStock",
        p.cat_id AS "categoryId",
        c.nam_cat AS "categoryName",
        p.act_pro AS "isActive"
      FROM products p
      LEFT JOIN categories c ON p.cat_id = c.id
      LEFT JOIN inventories i ON i.pro_id = p.id
      WHERE p.id = $1
      GROUP BY p.id, p.cod_pro, p.nam_pro, p.sal_pri_pro, p.cos_pri_pro, p.cat_id, c.nam_cat, p.act_pro;
    `;

    const stockQuery = `
      SELECT
        w.id AS "warehouseId",
        w.nam_war AS "warehouseName",
        COALESCE(i.cur_sto, 0) AS "currentStock"
      FROM inventories i
      INNER JOIN warehouses w ON i.war_id = w.id
      WHERE i.pro_id = $1
      ORDER BY w.nam_war;
    `;

    const productResult = await this.pool.query<ProductRow>(productQuery, [id]);
    if (productResult.rows.length === 0) {
      return null;
    }

    const stockResult = await this.pool.query<ProductWarehouseStockRow>(stockQuery, [id]);
    const row = productResult.rows[0];

    return {
      id: row.id,
      code: row.code,
      name: row.name,
      salePrice: Number(row.salePrice),
      costPrice: Number(row.costPrice),
      currentStock: Number(row.currentStock),
      categoryId: row.categoryId,
      categoryName: row.categoryName,
      isActive: row.isActive,
      warehouseStock: stockResult.rows.map((stock) => ({
        warehouseId: stock.warehouseId,
        warehouseName: stock.warehouseName,
        currentStock: Number(stock.currentStock),
      })),
    };
  }
}
