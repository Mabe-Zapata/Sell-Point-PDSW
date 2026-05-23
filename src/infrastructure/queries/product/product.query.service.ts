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
      FROM "PRODUCTS" p
      LEFT JOIN "INVENTORIES" i ON i."PRO_ID" = p.id
      WHERE ($1::varchar IS NULL OR p."NAM_PRO" ILIKE $1 OR p."COD_PRO" ILIKE $1)
        AND ($2::uuid IS NULL OR p."CAT_ID" = $2)
        AND ($3::boolean IS NULL OR p."ACT_PRO" = $3);
    `;

    const listQuery = `
      SELECT
        p.id,
        p."COD_PRO" AS "code",
        p."NAM_PRO" AS "name",
        p."SAL_PRI_PRO" AS "salePrice",
        p."COS_PRI_PRO" AS "costPrice",
        p."CUR_STO_PRO" AS "currentStock",
        p."ACT_PRO" AS "isActive",
        p."CAT_ID" AS "categoryId",
        c."NAM_CAT" AS "categoryName"
      FROM "PRODUCTS" p
      LEFT JOIN "CATEGORIES" c ON p."CAT_ID" = c.id
      WHERE ($1::varchar IS NULL OR p."NAM_PRO" ILIKE $1 OR p."COD_PRO" ILIKE $1)
        AND ($2::uuid IS NULL OR p."CAT_ID" = $2)
        AND ($3::boolean IS NULL OR p."ACT_PRO" = $3)
      ORDER BY p."CRE_AT" DESC
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
    // Note: warehouse stock tracking removed (simplify-schema-uta SDD)
    // currentStock now lives directly on PRODUCTS.CUR_STO_PRO
    const productQuery = `
      SELECT
        p.id,
        p."COD_PRO" AS "code",
        p."NAM_PRO" AS "name",
        p."SAL_PRI_PRO" AS "salePrice",
        p."COS_PRI_PRO" AS "costPrice",
        p."CUR_STO_PRO" AS "currentStock",
        p."CAT_ID" AS "categoryId",
        c."NAM_CAT" AS "categoryName",
        p."ACT_PRO" AS "isActive"
      FROM "PRODUCTS" p
      LEFT JOIN "CATEGORIES" c ON p."CAT_ID" = c.id
      WHERE p.id = $1;
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
      warehouseStock: [], // Warehouse tracking removed (simplify-schema-uta SDD)
    };
  }
}
