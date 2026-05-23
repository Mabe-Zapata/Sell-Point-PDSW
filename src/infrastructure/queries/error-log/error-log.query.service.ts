/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { getPgPool } from '../base/pg-pool';
import {
  ErrorLogListItem,
  IErrorLogQueryService,
} from '../../../domain/query-services/error-log.query-service.interface';

interface ErrorLogRow {
  id: string;
  exceptionType: string;
  message: string;
  stackTrace: string | null;
  source: string | null;
  userId: string | null;
  createdAt: Date;
  userUsername: string | null;
}

@Injectable()
export class ErrorLogQueryService implements IErrorLogQueryService {
  private readonly pool: Pool;

  constructor(private readonly configService: ConfigService) {
    this.pool = getPgPool(configService);
  }

  async listErrorLogs(params: {
    page: number;
    limit: number;
    exceptionType?: string;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<{ data: ErrorLogListItem[]; total: number; page: number; limit: number }> {
    const { page, limit, exceptionType, userId, startDate, endDate } = params;
    const offset = (page - 1) * limit;

    const countQuery = `
      SELECT COUNT(*)::integer AS total
      FROM "ERROR_LOGS" el
      WHERE ($1::varchar IS NULL OR el."EXC_TYP" = $1)
        AND ($2::uuid IS NULL OR el."USR_ID" = $2)
        AND ($3::timestamp IS NULL OR el."CRE_AT" >= $3)
        AND ($4::timestamp IS NULL OR el."CRE_AT" <= $4);
    `;

    const listQuery = `
      SELECT
        el.id,
        el."EXC_TYP" AS "exceptionType",
        el."MES_ERR" AS "message",
        el."STA_TRA" AS "stackTrace",
        el."SRC_ERR" AS "source",
        el."USR_ID" AS "userId",
        el."CRE_AT" AS "createdAt",
        usr."USR_USR" AS "userUsername"
      FROM "ERROR_LOGS" el
      LEFT JOIN "USERS" usr ON el."USR_ID" = usr.id
      WHERE ($1::varchar IS NULL OR el."EXC_TYP" = $1)
        AND ($2::uuid IS NULL OR el."USR_ID" = $2)
        AND ($3::timestamp IS NULL OR el."CRE_AT" >= $3)
        AND ($4::timestamp IS NULL OR el."CRE_AT" <= $4)
      ORDER BY el."CRE_AT" DESC
      LIMIT $5 OFFSET $6;
    `;

    const [countResult, listResult] = await Promise.all([
      this.pool.query(countQuery, [exceptionType ?? null, userId ?? null, startDate ?? null, endDate ?? null]),
      this.pool.query<ErrorLogRow>(listQuery, [exceptionType ?? null, userId ?? null, startDate ?? null, endDate ?? null, limit, offset]),
    ]);

    return {
      data: listResult.rows.map((row): ErrorLogListItem => ({
        id: row.id,
        exceptionType: row.exceptionType,
        message: row.message,
        source: row.source ?? '',
        userId: row.userId,
        userUsername: row.userUsername,
        createdAt: row.createdAt,
      })),
      total: Number(countResult.rows[0].total),
      page,
      limit,
    };
  }

  async getErrorLogById(id: string): Promise<ErrorLogListItem | null> {
    const query = `
      SELECT
        el.id,
        el."EXC_TYP" AS "exceptionType",
        el."MES_ERR" AS "message",
        el."STA_TRA" AS "stackTrace",
        el."SRC_ERR" AS "source",
        el."USR_ID" AS "userId",
        el."CRE_AT" AS "createdAt",
        usr."USR_USR" AS "userUsername"
      FROM "ERROR_LOGS" el
      LEFT JOIN "USERS" usr ON el."USR_ID" = usr.id
      WHERE el.id = $1
      LIMIT 1;
    `;

    const result = await this.pool.query<ErrorLogRow>(query, [id]);
    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      exceptionType: row.exceptionType,
      message: row.message,
      source: row.source ?? '',
      userId: row.userId,
      userUsername: row.userUsername,
      createdAt: row.createdAt,
    };
  }
}
