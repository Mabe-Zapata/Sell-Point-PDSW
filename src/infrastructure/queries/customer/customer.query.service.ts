/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { getPgPool } from '../base/pg-pool';
import {
  CustomerListItem,
  ICustomerQueryService,
} from '../../../domain/query-services/customer.query-service.interface';
import { Customer } from '../../../domain/entities/customer.entity';

interface CountRow {
  total: number;
}

interface CustomerRow {
  id: string;
  // identificationType/identificationNumber replaced by cedula (simplify-schema-uta SDD)
  cedula: string;
  names: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  createdAt: Date;
}

@Injectable()
export class CustomerQueryService implements ICustomerQueryService {
  private readonly pool: Pool;

  constructor(private readonly configService: ConfigService) {
    this.pool = getPgPool(configService);
  }

  async listCustomers(params: {
    page: number;
    limit: number;
    q?: string;
    cedula?: string;
  }): Promise<{ data: CustomerListItem[]; total: number; page: number; limit: number }> {
    const { page, limit, q, cedula } = params;
    const offset = (page - 1) * limit;
    const searchPattern = q ? `%${q}%` : null;

    const countQuery = `
      SELECT COUNT(*)::integer AS total
      FROM "CUSTOMERS" c
      WHERE ($1::varchar IS NULL OR c."NAM_CUS" ILIKE $1 OR c."CED_CUS" ILIKE $1)
        AND ($2::varchar IS NULL OR c."CED_CUS" = $2);
    `;

    const listQuery = `
      SELECT
        c.id,
        c."CED_CUS" AS "cedula",
        c."NAM_CUS" AS "names",
        c."EMA_CUS" AS "email",
        c."PHO_CUS" AS "phone",
        c."ADD_CUS" AS "address",
        c."CRE_AT" AS "createdAt"
      FROM "CUSTOMERS" c
      WHERE ($1::varchar IS NULL OR c."NAM_CUS" ILIKE $1 OR c."CED_CUS" ILIKE $1)
        AND ($2::varchar IS NULL OR c."CED_CUS" = $2)
      ORDER BY c."CRE_AT" DESC
      LIMIT $3 OFFSET $4;
    `;

    const [countResult, listResult] = await Promise.all([
      this.pool.query<CountRow>(countQuery, [searchPattern, cedula ?? null]),
      this.pool.query<CustomerRow>(listQuery, [searchPattern, cedula ?? null, limit, offset]),
    ]);

    return {
      data: listResult.rows.map((row): CustomerListItem => ({
        id: row.id,
        cedula: row.cedula,
        names: row.names,
        email: row.email,
        phone: row.phone,
        address: row.address,
        createdAt: row.createdAt,
      })),
      total: countResult.rows[0].total,
      page,
      limit,
    };
  }

  async getCustomerByIdentification(cedula: string): Promise<Customer | null> {
    const query = `
      SELECT
        c.id,
        c."CED_CUS" AS "cedula",
        c."NAM_CUS" AS "names",
        c."EMA_CUS" AS "email",
        c."PHO_CUS" AS "phone",
        c."ADD_CUS" AS "address",
        c."CRE_AT" AS "createdAt",
        c."UPD_AT" AS "updatedAt"
      FROM "CUSTOMERS" c
      WHERE c."CED_CUS" = $1
      LIMIT 1;
    `;

    const result = await this.pool.query<CustomerRow>(query, [cedula]);
    if (result.rows.length === 0) {
      return null;
    }

    return new Customer({
      cedula: result.rows[0].cedula,
      names: result.rows[0].names,
      email: result.rows[0].email ?? undefined,
      phone: result.rows[0].phone ?? undefined,
      address: result.rows[0].address ?? undefined,
      createdAt: result.rows[0].createdAt,
      updatedAt: new Date(),
    });
  }
}
