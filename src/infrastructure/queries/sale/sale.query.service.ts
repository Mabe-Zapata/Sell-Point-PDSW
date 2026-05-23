/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { getPgPool } from '../base/pg-pool';
import {
  ISaleQueryService,
  SaleListItem,
  SaleWithDetails,
} from '../../../domain/query-services/sale.query-service.interface';

@Injectable()
export class SaleQueryService implements ISaleQueryService {
  private readonly pool: Pool;

  constructor(private readonly configService: ConfigService) {
    this.pool = getPgPool(configService);
  }

  async listSales(params: {
    page: number;
    limit: number;
    branchId?: string;
    customerId?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<{ data: SaleListItem[]; total: number; page: number; limit: number }> {
    const { page, limit, branchId, customerId, status, startDate, endDate } = params;
    const offset = (page - 1) * limit;

    const countQuery = `
      SELECT COUNT(*)::integer AS total
      FROM "SALES" sal
      WHERE ($1::uuid IS NULL OR sal."BRA_ID" = $1)
        AND ($2::uuid IS NULL OR sal."CUS_ID" = $2)
        AND ($3::varchar IS NULL OR sal."STA_SAL" = $3)
        AND ($4::timestamp IS NULL OR sal."CRE_AT" >= $4)
        AND ($5::timestamp IS NULL OR sal."CRE_AT" <= $5);
    `;

    const listQuery = `
      SELECT
        sal.id,
        sal."SAL_NUM" AS "saleNumber",
        sal."STA_SAL" AS "status",
        sal."SUB_SAL" AS subtotal,
        sal."TAX_AMO_SAL" AS "taxAmount",
        sal."DIS_AMO_SAL" AS "discountAmount",
        sal."TOT_SAL" AS total,
        sal."CRE_AT" AS "createdAt",
        sal."BRA_ID" AS "branchId",
        sal."CUS_ID" AS "customerId",
        cus."NAM_CUS" AS "customerName",
        usr."USR_USR" AS "cashierUsername"
      FROM "SALES" sal
      INNER JOIN "CUSTOMERS" cus ON sal."CUS_ID" = cus.id
      INNER JOIN "USERS" usr ON sal."CAS_USR_ID" = usr.id
      WHERE ($1::uuid IS NULL OR sal."BRA_ID" = $1)
        AND ($2::uuid IS NULL OR sal."CUS_ID" = $2)
        AND ($3::varchar IS NULL OR sal."STA_SAL" = $3)
        AND ($4::timestamp IS NULL OR sal."CRE_AT" >= $4)
        AND ($5::timestamp IS NULL OR sal."CRE_AT" <= $5)
      ORDER BY sal."CRE_AT" DESC
      LIMIT $6 OFFSET $7;
    `;

    const countResult = await this.pool.query(countQuery, [
      branchId ?? null,
      customerId ?? null,
      status ?? null,
      startDate ?? null,
      endDate ?? null,
    ]);

    const listResult = await this.pool.query(listQuery, [
      branchId ?? null,
      customerId ?? null,
      status ?? null,
      startDate ?? null,
      endDate ?? null,
      limit,
      offset,
    ]);

    return {
      data: listResult.rows,
      total: Number(countResult.rows[0].total),
      page,
      limit,
    };
  }

  async getSaleWithDetails(id: string): Promise<SaleWithDetails | null> {
    // Note: customerIdentificationType/Number replaced by cedula (simplify-schema-uta SDD)
    const saleQuery = `
      SELECT
        sal.id,
        sal."SAL_NUM" AS "saleNumber",
        sal."STA_SAL" AS "status",
        sal."SUB_SAL" AS subtotal,
        sal."TAX_AMO_SAL" AS "taxAmount",
        sal."DIS_AMO_SAL" AS "discountAmount",
        sal."TOT_SAL" AS total,
        sal."CRE_AT" AS "createdAt",
        sal."UPD_AT" AS "updatedAt",
        sal."BRA_ID" AS "branchId",
        sal."CUS_ID" AS "customerId",
        sal."CAS_USR_ID" AS "cashierUserId",
        sal."TAX_RAT_ID" AS "taxRateId",
        cus."NAM_CUS" AS "customerName",
        cus."CED_CUS" AS "customerCedula",
        usr."USR_USR" AS "cashierUsername"
      FROM "SALES" sal
      INNER JOIN "CUSTOMERS" cus ON sal."CUS_ID" = cus.id
      INNER JOIN "USERS" usr ON sal."CAS_USR_ID" = usr.id
      WHERE sal.id = $1;
    `;

    const detailsQuery = `
      SELECT
        sd.id,
        sd."SAL_ID" AS "saleId",
        sd."PRO_ID" AS "productId",
        sd."PRO_NAM_SAL" AS "productName",
        sd."PRO_COD_SAL" AS "productCode",
        sd."QTY_SAL_DET" AS quantity,
        sd."UNT_PRI_SAL" AS "unitPrice",
        sd."CRE_AT" AS "createdAt"
      FROM "SALE_DETAILS" sd
      WHERE sd."SAL_ID" = $1;
    `;

    const saleResult = await this.pool.query(saleQuery, [id]);
    if (saleResult.rows.length === 0) {
      return null;
    }

    const detailsResult = await this.pool.query(detailsQuery, [id]);

    const sale = saleResult.rows[0];
    return {
      ...sale,
      details: detailsResult.rows,
    };
  }
}