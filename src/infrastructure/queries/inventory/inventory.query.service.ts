/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { getPgPool } from '../base/pg-pool';
import {
  IInventoryQueryService,
  StockLevel,
  MovementHistory,
} from '../../../domain/query-services/inventory.query-service.interface';

interface StockLevelRow {
  inventoryId: string;
  warehouseId: string;
  warehouseName: string;
  productId: string;
  productCode: string;
  productName: string;
  currentStock: number | string;
  minimumStock: number | string;
  maximumStock: number | string;
}

interface MovementHistoryRow {
  id: string;
  warehouseId: string;
  warehouseName: string;
  productId: string;
  productName: string;
  type: string;
  quantity: number | string;
  stockBefore: number | string;
  stockAfter: number | string;
  userId: string | null;
  userUsername: string | null;
  referenceType: string | null;
  referenceId: string | null;
  description: string | null;
  createdAt: Date;
}

@Injectable()
export class InventoryQueryService implements IInventoryQueryService {
  private readonly pool: Pool;

  constructor(private readonly configService: ConfigService) {
    this.pool = getPgPool(configService);
  }

  async getStockLevels(params: {
    page: number;
    limit: number;
    warehouseId?: string;
    productId?: string;
    belowMinimum?: boolean;
  }): Promise<{ data: StockLevel[]; total: number; page: number; limit: number }> {
    const { page, limit, warehouseId, productId, belowMinimum } = params;
    const offset = (page - 1) * limit;

    const countQuery = `
      SELECT COUNT(*)::integer AS total
      FROM inventories i
      INNER JOIN products p ON i.pro_id = p.id
      INNER JOIN warehouses w ON i.war_id = w.id
      INNER JOIN branches b ON w.bra_id = b.id
      WHERE ($1::uuid IS NULL OR w.id = $1)
        AND ($2::uuid IS NULL OR i.pro_id = $2)
        AND ($3::boolean IS NULL OR ($3 = true AND i.cur_sto < i.min_sto));
    `;

    const listQuery = `
      SELECT
        i.id AS "inventoryId",
        i.war_id AS "warehouseId",
        w.nam_war AS "warehouseName",
        i.pro_id AS "productId",
        p.cod_pro AS "productCode",
        p.nam_pro AS "productName",
        i.cur_sto AS "currentStock",
        i.min_sto AS "minimumStock",
        i.max_sto AS "maximumStock",
        b.nam_bra AS "branchName"
      FROM inventories i
      INNER JOIN products p ON i.pro_id = p.id
      INNER JOIN warehouses w ON i.war_id = w.id
      INNER JOIN branches b ON w.bra_id = b.id
      WHERE ($1::uuid IS NULL OR w.id = $1)
        AND ($2::uuid IS NULL OR i.pro_id = $2)
        AND ($3::boolean IS NULL OR ($3 = true AND i.cur_sto < i.min_sto))
      ORDER BY b.nam_bra, w.nam_war, p.nam_pro
      LIMIT $4 OFFSET $5;
    `;

    const [countResult, listResult] = await Promise.all([
      this.pool.query(countQuery, [warehouseId ?? null, productId ?? null, belowMinimum ?? null]),
      this.pool.query<StockLevelRow>(listQuery, [warehouseId ?? null, productId ?? null, belowMinimum ?? null, limit, offset]),
    ]);

    return {
      data: listResult.rows.map((row) => ({
        inventoryId: row.inventoryId,
        warehouseId: row.warehouseId,
        warehouseName: row.warehouseName,
        productId: row.productId,
        productCode: row.productCode,
        productName: row.productName,
        currentStock: Number(row.currentStock),
        minimumStock: Number(row.minimumStock),
        maximumStock: Number(row.maximumStock),
      })),
      total: Number(countResult.rows[0].total),
      page,
      limit,
    };
  }

  async getMovementsHistory(params: {
    page: number;
    limit: number;
    warehouseId?: string;
    productId?: string;
    type?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<{ data: MovementHistory[]; total: number; page: number; limit: number }> {
    const { page, limit, warehouseId, productId, type, startDate, endDate } = params;
    const offset = (page - 1) * limit;

    const countQuery = `
      SELECT COUNT(*)::integer AS total
      FROM stock_movements sm
      WHERE ($1::uuid IS NULL OR sm.war_id = $1)
        AND ($2::uuid IS NULL OR sm.pro_id = $2)
        AND ($3::varchar IS NULL OR sm.typ_mov = $3)
        AND ($4::timestamp IS NULL OR sm.cre_at >= $4)
        AND ($5::timestamp IS NULL OR sm.cre_at <= $5);
    `;

    const listQuery = `
      SELECT
        sm.id,
        sm.war_id AS "warehouseId",
        sm.pro_id AS "productId",
        sm.typ_mov AS "type",
        sm.qty_mov AS quantity,
        sm.sto_bef AS "stockBefore",
        sm.sto_aft AS "stockAfter",
        sm.usr_id AS "userId",
        sm.ref_typ AS "referenceType",
        sm.ref_id AS "referenceId",
        sm.des_mov AS description,
        sm.cre_at AS "createdAt",
        p.nam_pro AS "productName",
        p.cod_pro AS "productCode",
        w.nam_war AS "warehouseName",
        usr.usr_usr AS "userUsername"
      FROM stock_movements sm
      INNER JOIN products p ON sm.pro_id = p.id
      INNER JOIN warehouses w ON sm.war_id = w.id
      LEFT JOIN users usr ON sm.usr_id = usr.id
      WHERE ($1::uuid IS NULL OR sm.war_id = $1)
        AND ($2::uuid IS NULL OR sm.pro_id = $2)
        AND ($3::varchar IS NULL OR sm.typ_mov = $3)
        AND ($4::timestamp IS NULL OR sm.cre_at >= $4)
        AND ($5::timestamp IS NULL OR sm.cre_at <= $5)
      ORDER BY sm.cre_at DESC
      LIMIT $6 OFFSET $7;
    `;

    const [countResult, listResult] = await Promise.all([
      this.pool.query(countQuery, [
        warehouseId ?? null,
        productId ?? null,
        type ?? null,
        startDate ?? null,
        endDate ?? null,
      ]),
      this.pool.query<MovementHistoryRow>(listQuery, [
        warehouseId ?? null,
        productId ?? null,
        type ?? null,
        startDate ?? null,
        endDate ?? null,
        limit,
        offset,
      ]),
    ]);

    return {
      data: listResult.rows.map((row) => ({
        id: row.id,
        warehouseId: row.warehouseId,
        warehouseName: row.warehouseName,
        productId: row.productId,
        productName: row.productName,
        type: row.type,
        quantity: Number(row.quantity),
        stockBefore: Number(row.stockBefore),
        stockAfter: Number(row.stockAfter),
        userId: row.userId,
        userUsername: row.userUsername,
        referenceType: row.referenceType,
        referenceId: row.referenceId,
        description: row.description,
        createdAt: row.createdAt,
      })),
      total: Number(countResult.rows[0].total),
      page,
      limit,
    };
  }
}
