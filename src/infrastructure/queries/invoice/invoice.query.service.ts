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
  customerCedula: string;
  // branchName removed — branch entity deleted (simplify-schema-uta SDD)
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
      FROM "INVOICES" i
      INNER JOIN "INVOICE_SERIES" ser ON i."SER_ID" = ser.id
      WHERE ($1::uuid IS NULL OR ser."BRA_ID" = $1)
        AND ($2::varchar IS NULL OR i."STA_INV" = $2)
        AND ($3::varchar IS NULL OR i."INV_NUM" ILIKE $3)
        AND ($4::timestamp IS NULL OR i."CRE_AT" >= $4)
        AND ($5::timestamp IS NULL OR i."CRE_AT" <= $5);
    `;

    const listQuery = `
      SELECT
        i.id,
        i."INV_NUM" AS "invoiceNumber",
        i."AUT_NUM" AS "authorizationNumber",
        i."ISS_DAT_INV" AS "issueDate",
        i."STA_INV" AS "status",
        i."CAN_AT_INV" AS "cancelledAt",
        i."CRE_AT" AS "createdAt",
        i."SAL_ID" AS "saleId",
        i."SER_ID" AS "seriesId",
        sal."SAL_NUM" AS "saleNumber",
        ser."EST_COD_SER" AS "establishmentCode",
        ser."EMI_POI_COD_SER" AS "emissionPointCode",
        sal."TOT_SAL" AS "total",
        CONCAT(cus."NOM_CUS", ' ', cus."APE_CUS") AS "customerName",
        cus."CED_CUS" AS "customerCedula"
      FROM "INVOICES" i
      INNER JOIN "INVOICE_SERIES" ser ON i."SER_ID" = ser.id
      INNER JOIN "SALES" sal ON i."SAL_ID" = sal.id
      INNER JOIN "CUSTOMERS" cus ON sal."CUS_ID" = cus.id
      WHERE ($1::uuid IS NULL OR ser."BRA_ID" = $1)
        AND ($2::varchar IS NULL OR i."STA_INV" = $2)
        AND ($3::varchar IS NULL OR i."INV_NUM" ILIKE $3)
        AND ($4::timestamp IS NULL OR i."CRE_AT" >= $4)
        AND ($5::timestamp IS NULL OR i."CRE_AT" <= $5)
      ORDER BY i."CRE_AT" DESC
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
        i."INV_NUM" AS "invoiceNumber",
        i."AUT_NUM" AS "authorizationNumber",
        i."ISS_DAT_INV" AS "issueDate",
        i."STA_INV" AS "status",
        i."CAN_AT_INV" AS "cancelledAt",
        i."CRE_AT" AS "createdAt",
        i."SAL_ID" AS "saleId",
        i."SER_ID" AS "seriesId",
        sal."SAL_NUM" AS "saleNumber",
        ser."EST_COD_SER" AS "establishmentCode",
        ser."EMI_POI_COD_SER" AS "emissionPointCode",
        sal."TOT_SAL" AS "total",
        CONCAT(cus."NOM_CUS", ' ', cus."APE_CUS") AS "customerName",
        cus."CED_CUS" AS "customerCedula"
      FROM "INVOICES" i
      INNER JOIN "INVOICE_SERIES" ser ON i."SER_ID" = ser.id
      INNER JOIN "SALES" sal ON i."SAL_ID" = sal.id
      INNER JOIN "CUSTOMERS" cus ON sal."CUS_ID" = cus.id
      WHERE i."SAL_ID" = $1
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

  async getInvoiceById(id: string): Promise<InvoiceListItem | null> {
    const query = `
      SELECT
        i.id,
        i."INV_NUM" AS "invoiceNumber",
        i."AUT_NUM" AS "authorizationNumber",
        i."ISS_DAT_INV" AS "issueDate",
        i."STA_INV" AS "status",
        i."CAN_AT_INV" AS "cancelledAt",
        i."CRE_AT" AS "createdAt",
        i."SAL_ID" AS "saleId",
        i."SER_ID" AS "seriesId",
        sal."SAL_NUM" AS "saleNumber",
        ser."EST_COD_SER" AS "establishmentCode",
        ser."EMI_POI_COD_SER" AS "emissionPointCode",
        sal."TOT_SAL" AS "total",
        CONCAT(cus."NOM_CUS", ' ', cus."APE_CUS") AS "customerName",
        cus."CED_CUS" AS "customerCedula"
      FROM "INVOICES" i
      INNER JOIN "INVOICE_SERIES" ser ON i."SER_ID" = ser.id
      INNER JOIN "SALES" sal ON i."SAL_ID" = sal.id
      INNER JOIN "CUSTOMERS" cus ON sal."CUS_ID" = cus.id
      WHERE i.id = $1
      LIMIT 1;
    `;

    const result = await this.pool.query<InvoiceListRow>(query, [id]);
    if (result.rows.length === 0) {
      return null;
    }

    return {
      ...result.rows[0],
      total: Number(result.rows[0].total),
    };
  }
}
