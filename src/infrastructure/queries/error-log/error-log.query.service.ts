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
      FROM error_logs el
      WHERE ($1::varchar IS NULL OR el.exc_typ = $1)
        AND ($2::uuid IS NULL OR el.usr_id = $2)
        AND ($3::timestamp IS NULL OR el.cre_at >= $3)
        AND ($4::timestamp IS NULL OR el.cre_at <= $4);
    `;

    const listQuery = `
      SELECT
        el.id,
        el.exc_typ AS "exceptionType",
        el.mes_err AS "message",
        el.sta_tra AS "stackTrace",
        el.src_err AS "source",
        el.usr_id AS "userId",
        el.cre_at AS "createdAt",
        usr.usr_usr AS "userUsername"
      FROM error_logs el
      LEFT JOIN users usr ON el.usr_id = usr.id
      WHERE ($1::varchar IS NULL OR el.exc_typ = $1)
        AND ($2::uuid IS NULL OR el.usr_id = $2)
        AND ($3::timestamp IS NULL OR el.cre_at >= $3)
        AND ($4::timestamp IS NULL OR el.cre_at <= $4)
      ORDER BY el.cre_at DESC
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
        el.exc_typ AS "exceptionType",
        el.mes_err AS "message",
        el.sta_tra AS "stackTrace",
        el.src_err AS "source",
        el.usr_id AS "userId",
        el.cre_at AS "createdAt",
        usr.usr_usr AS "userUsername"
      FROM error_logs el
      LEFT JOIN users usr ON el.usr_id = usr.id
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
