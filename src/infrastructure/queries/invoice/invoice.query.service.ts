/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { getPgPool } from '../base/pg-pool';
import { PaginatedResult } from '../../../domain/repositories/pagination.types';
import {
  IInvoiceQueryService,
  InvoiceListItem,
} from '../../../domain/query-services/invoice.query-service.interface';

interface InvoiceListRow {
  id: string;
  invoiceNumber: string;
  authorizationNumber: string | null;
  issueDate: Date;
  status: string;
  cancelledAt: Date | null;
  createdAt: Date;
  saleId: string;
  seriesId: string;
  saleNumber: string;
  customerName: string;
  customerIdentificationNumber: string;
  branchName: string;
  total: string | number;
  establishmentCode: string;
  emissionPointCode: string;
}

interface CountRow {
  total: number;
}

@Injectable()
export class InvoiceQueryService implements IInvoiceQueryService {
  private readonly pool: Pool;

  constructor(private readonly configService: ConfigService) {
    this.pool = getPgPool(configService);
  }

  async listInvoices(params: {
    page: number;
    limit: number;
    branchId?: string;
    status?: string;
    invoiceNumber?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<PaginatedResult<InvoiceListItem>> {
    const { page, limit, branchId, status, invoiceNumber, startDate, endDate } = params;
    const offset = (page - 1) * limit;
    const searchPattern = invoiceNumber ? `%${invoiceNumber}%` : null;

    const countQuery = `
      SELECT COUNT(*)::integer AS total
      FROM invoices i
      INNER JOIN invoice_series ser ON i.ser_id = ser.id
      WHERE ($1::uuid IS NULL OR ser.bra_id = $1)
        AND ($2::varchar IS NULL OR i.sta_inv = $2)
        AND ($3::varchar IS NULL OR i.inv_num ILIKE $3)
        AND ($4::timestamp IS NULL OR i.cre_at >= $4)
        AND ($5::timestamp IS NULL OR i.cre_at <= $5);
    `;

    const listQuery = `
      SELECT
        i.id,
        i.inv_num AS "invoiceNumber",
        i.aut_num AS "authorizationNumber",
        i.iss_dat_inv AS "issueDate",
        i.sta_inv AS "status",
        i.can_at_inv AS "cancelledAt",
        i.cre_at AS "createdAt",
        i.sal_id AS "saleId",
        i.ser_id AS "seriesId",
        sal.sal_num AS "saleNumber",
        ser.est_cod_ser AS "establishmentCode",
        ser.emi_poi_cod_ser AS "emissionPointCode",
        bra.nam_bra AS "branchName",
        sal.tot_sal AS "total",
        cus.nam_cus AS "customerName",
        cus.idt_num AS "customerIdentificationNumber"
      FROM invoices i
      INNER JOIN invoice_series ser ON i.ser_id = ser.id
      INNER JOIN sales sal ON i.sal_id = sal.id
      INNER JOIN customers cus ON sal.cus_id = cus.id
      INNER JOIN branches bra ON sal.bra_id = bra.id
      WHERE ($1::uuid IS NULL OR ser.bra_id = $1)
        AND ($2::varchar IS NULL OR i.sta_inv = $2)
        AND ($3::varchar IS NULL OR i.inv_num ILIKE $3)
        AND ($4::timestamp IS NULL OR i.cre_at >= $4)
        AND ($5::timestamp IS NULL OR i.cre_at <= $5)
      ORDER BY i.cre_at DESC
      LIMIT $6 OFFSET $7;
    `;

    const [countResult, listResult] = await Promise.all([
      this.pool.query<CountRow>(countQuery, [
        branchId ?? null,
        status ?? null,
        searchPattern,
        startDate ?? null,
        endDate ?? null,
      ]),
      this.pool.query<InvoiceListRow>(listQuery, [
        branchId ?? null,
        status ?? null,
        searchPattern,
        startDate ?? null,
        endDate ?? null,
        limit,
        offset,
      ]),
    ]);

    return {
      data: listResult.rows.map((row) => ({
        ...row,
        total: Number(row.total),
      })),
      total: countResult.rows[0].total,
      page,
      limit,
    };
  }

  async getInvoiceBySaleId(saleId: string): Promise<InvoiceListItem | null> {
    const query = `
      SELECT
        i.id,
        i.inv_num AS "invoiceNumber",
        i.aut_num AS "authorizationNumber",
        i.iss_dat_inv AS "issueDate",
        i.sta_inv AS "status",
        i.can_at_inv AS "cancelledAt",
        i.cre_at AS "createdAt",
        i.sal_id AS "saleId",
        i.ser_id AS "seriesId",
        sal.sal_num AS "saleNumber",
        ser.est_cod_ser AS "establishmentCode",
        ser.emi_poi_cod_ser AS "emissionPointCode",
        bra.nam_bra AS "branchName",
        sal.tot_sal AS "total",
        cus.nam_cus AS "customerName",
        cus.idt_num AS "customerIdentificationNumber"
      FROM invoices i
      INNER JOIN invoice_series ser ON i.ser_id = ser.id
      INNER JOIN sales sal ON i.sal_id = sal.id
      INNER JOIN customers cus ON sal.cus_id = cus.id
      INNER JOIN branches bra ON sal.bra_id = bra.id
      WHERE i.sal_id = $1
      LIMIT 1;
    `;

    const result = await this.pool.query<InvoiceListRow>(query, [saleId]);
    if (result.rows.length === 0) {
      return null;
    }

    return {
      ...result.rows[0],
      total: Number(result.rows[0].total),
    };
  }
}
