/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { getPgPool } from '../base/pg-pool';
import {
  IStockTransferQueryService,
  StockTransferListItem,
} from '../../../domain/query-services/stock-transfer.query-service.interface';
import { StockTransferDetail } from '../../../domain/entities/stock-transfer-detail.entity';

interface StockTransferRow {
  id: string;
  fromBranchId: string;
  fromBranchName: string;
  toBranchId: string;
  toBranchName: string;
  requesterUserId: string;
  requesterUsername: string;
  approverUserId: string | null;
  approverUsername: string | null;
  status: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface StockTransferDetailRow {
  id: string;
  stockTransferId: string;
  productId: string;
  quantity: number | string;
  createdAt: Date;
}

interface CountRow {
  total: number;
}

@Injectable()
export class StockTransferQueryService implements IStockTransferQueryService {
  private readonly pool: Pool;

  constructor(private readonly configService: ConfigService) {
    this.pool = getPgPool(configService);
  }

  async listTransfers(params: {
    page: number;
    limit: number;
    fromBranchId?: string;
    toBranchId?: string;
    status?: string;
  }): Promise<{ data: StockTransferListItem[]; total: number; page: number; limit: number }> {
    const { page, limit, fromBranchId, toBranchId, status } = params;
    const offset = (page - 1) * limit;

    const countQuery = `
      SELECT COUNT(*)::integer AS total
      FROM stock_transfers st
      WHERE ($1::uuid IS NULL OR st.from_bra_id = $1)
        AND ($2::uuid IS NULL OR st.to_bra_id = $2)
        AND ($3::varchar IS NULL OR st.sta_tra = $3);
    `;

    const listQuery = `
      SELECT
        st.id,
        st.from_bra_id AS "fromBranchId",
        fb.nam_bra AS "fromBranchName",
        st.to_bra_id AS "toBranchId",
        tb.nam_bra AS "toBranchName",
        st.req_usr_id AS "requesterUserId",
        ru.usr_usr AS "requesterUsername",
        st.app_usr_id AS "approverUserId",
        au.usr_usr AS "approverUsername",
        st.sta_tra AS "status",
        st.not_tra AS "notes",
        st.cre_at AS "createdAt",
        st.upd_at AS "updatedAt",
      FROM stock_transfers st
      INNER JOIN branches fb ON st.from_bra_id = fb.id
      INNER JOIN branches tb ON st.to_bra_id = tb.id
      INNER JOIN users ru ON st.req_usr_id = ru.id
      LEFT JOIN users au ON st.app_usr_id = au.id
      WHERE ($1::uuid IS NULL OR st.from_bra_id = $1)
        AND ($2::uuid IS NULL OR st.to_bra_id = $2)
        AND ($3::varchar IS NULL OR st.sta_tra = $3)
      ORDER BY st.cre_at DESC
      LIMIT $4 OFFSET $5;
    `;

    const [countResult, listResult] = await Promise.all([
      this.pool.query<CountRow>(countQuery, [fromBranchId ?? null, toBranchId ?? null, status ?? null]),
      this.pool.query<StockTransferRow>(listQuery, [fromBranchId ?? null, toBranchId ?? null, status ?? null, limit, offset]),
    ]);

    return {
      data: listResult.rows.map((row) => ({
        id: row.id,
        fromBranchId: row.fromBranchId,
        fromBranchName: row.fromBranchName,
        toBranchId: row.toBranchId,
        toBranchName: row.toBranchName,
        requesterUserId: row.requesterUserId,
        requesterUsername: row.requesterUsername,
        approverUserId: row.approverUserId,
        approverUsername: row.approverUsername,
        status: row.status,
        notes: row.notes,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        details: [],
      })),
      total: countResult.rows[0].total,
      page,
      limit,
    };
  }

  async getTransferWithDetails(id: string): Promise<StockTransferListItem | null> {
    const transferQuery = `
      SELECT
        st.id,
        st.from_bra_id AS "fromBranchId",
        fb.nam_bra AS "fromBranchName",
        st.to_bra_id AS "toBranchId",
        tb.nam_bra AS "toBranchName",
        st.req_usr_id AS "requesterUserId",
        ru.usr_usr AS "requesterUsername",
        st.app_usr_id AS "approverUserId",
        au.usr_usr AS "approverUsername",
        st.sta_tra AS "status",
        st.not_tra AS "notes",
        st.cre_at AS "createdAt",
        st.upd_at AS "updatedAt"
      FROM stock_transfers st
      INNER JOIN branches fb ON st.from_bra_id = fb.id
      INNER JOIN branches tb ON st.to_bra_id = tb.id
      INNER JOIN users ru ON st.req_usr_id = ru.id
      LEFT JOIN users au ON st.app_usr_id = au.id
      WHERE st.id = $1
      LIMIT 1;
    `;

    const detailsQuery = `
      SELECT
        d.id,
        d.stock_transfer_id AS "stockTransferId",
        d.pro_id AS "productId",
        d.qty_tra_det AS quantity,
        d.cre_at AS "createdAt"
      FROM stock_transfer_details d
      WHERE d.stock_transfer_id = $1
      ORDER BY d.cre_at ASC;
    `;

    const transferResult = await this.pool.query<StockTransferRow>(transferQuery, [id]);
    if (transferResult.rows.length === 0) {
      return null;
    }

    const detailsResult = await this.pool.query<StockTransferDetailRow>(detailsQuery, [id]);
    const row = transferResult.rows[0];

    return {
      id: row.id,
      fromBranchId: row.fromBranchId,
      fromBranchName: row.fromBranchName,
      toBranchId: row.toBranchId,
      toBranchName: row.toBranchName,
      requesterUserId: row.requesterUserId,
      requesterUsername: row.requesterUsername,
      approverUserId: row.approverUserId,
      approverUsername: row.approverUsername,
      status: row.status,
      notes: row.notes,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      details: detailsResult.rows.map((detail) => ({
        id: detail.id,
        stockTransferId: detail.stockTransferId,
        productId: detail.productId,
        quantity: Number(detail.quantity),
        createdAt: detail.createdAt,
      })) as StockTransferDetail[],
    };
  }
}
