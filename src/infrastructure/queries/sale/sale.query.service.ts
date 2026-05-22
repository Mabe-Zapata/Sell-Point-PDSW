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
      FROM sales sal
      WHERE ($1::uuid IS NULL OR sal.bra_id = $1)
        AND ($2::uuid IS NULL OR sal.cus_id = $2)
        AND ($3::varchar IS NULL OR sal.sta_sal = $3)
        AND ($4::timestamp IS NULL OR sal.cre_at >= $4)
        AND ($5::timestamp IS NULL OR sal.cre_at <= $5);
    `;

    const listQuery = `
      SELECT
        sal.id,
        sal.sal_num AS "saleNumber",
        sal.sta_sal AS "status",
        sal.sub_sal AS subtotal,
        sal.tax_amo_sal AS "taxAmount",
        sal.dis_amo_sal AS "discountAmount",
        sal.tot_sal AS total,
        sal.cre_at AS "createdAt",
        sal.bra_id AS "branchId",
        sal.cus_id AS "customerId",
        cus.nam_cus AS "customerName",
        usr.usr_usr AS "cashierUsername"
      FROM sales sal
      INNER JOIN customers cus ON sal.cus_id = cus.id
      INNER JOIN users usr ON sal.cas_usr_id = usr.id
      WHERE ($1::uuid IS NULL OR sal.bra_id = $1)
        AND ($2::uuid IS NULL OR sal.cus_id = $2)
        AND ($3::varchar IS NULL OR sal.sta_sal = $3)
        AND ($4::timestamp IS NULL OR sal.cre_at >= $4)
        AND ($5::timestamp IS NULL OR sal.cre_at <= $5)
      ORDER BY sal.cre_at DESC
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
    const saleQuery = `
      SELECT
        sal.id,
        sal.sal_num AS "saleNumber",
        sal.sta_sal AS "status",
        sal.sub_sal AS subtotal,
        sal.tax_amo_sal AS "taxAmount",
        sal.dis_amo_sal AS "discountAmount",
        sal.tot_sal AS total,
        sal.cre_at AS "createdAt",
        sal.upd_at AS "updatedAt",
        sal.bra_id AS "branchId",
        sal.cus_id AS "customerId",
        sal.cas_usr_id AS "cashierUserId",
        sal.tax_rat_id AS "taxRateId",
        cus.nam_cus AS "customerName",
        cus.idt_typ AS "customerIdentificationType",
        cus.idt_num AS "customerIdentificationNumber",
        usr.usr_usr AS "cashierUsername"
      FROM sales sal
      INNER JOIN customers cus ON sal.cus_id = cus.id
      INNER JOIN users usr ON sal.cas_usr_id = usr.id
      WHERE sal.id = $1;
    `;

    const detailsQuery = `
      SELECT
        sd.id,
        sd.sal_id AS "saleId",
        sd.pro_id AS "productId",
        sd.pro_nam_sal AS "productName",
        sd.pro_cod_sal AS "productCode",
        sd.qty_sal_det AS quantity,
        sd.unt_pri_sal AS "unitPrice",
        sd.cre_at AS "createdAt"
      FROM sale_details sd
      WHERE sd.sal_id = $1;
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