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
  identificationType: string;
  identificationNumber: string;
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
    identificationType?: string;
  }): Promise<{ data: CustomerListItem[]; total: number; page: number; limit: number }> {
    const { page, limit, q, identificationType } = params;
    const offset = (page - 1) * limit;
    const searchPattern = q ? `%${q}%` : null;

    const countQuery = `
      SELECT COUNT(*)::integer AS total
      FROM customers c
      WHERE ($1::varchar IS NULL OR c.nam_cus ILIKE $1 OR c.idt_num ILIKE $1)
        AND ($2::varchar IS NULL OR c.idt_typ = $2);
    `;

    const listQuery = `
      SELECT
        c.id,
        c.idt_typ AS "identificationType",
        c.idt_num AS "identificationNumber",
        c.nam_cus AS "names",
        c.ema_cus AS "email",
        c.pho_cus AS "phone",
        c.add_cus AS "address",
        c.cre_at AS "createdAt"
      FROM customers c
      WHERE ($1::varchar IS NULL OR c.nam_cus ILIKE $1 OR c.idt_num ILIKE $1)
        AND ($2::varchar IS NULL OR c.idt_typ = $2)
      ORDER BY c.cre_at DESC
      LIMIT $3 OFFSET $4;
    `;

    const [countResult, listResult] = await Promise.all([
      this.pool.query<CountRow>(countQuery, [searchPattern, identificationType ?? null]),
      this.pool.query<CustomerRow>(listQuery, [searchPattern, identificationType ?? null, limit, offset]),
    ]);

    return {
      data: listResult.rows.map((row): CustomerListItem => ({
        id: row.id,
        identificationType: row.identificationType,
        identificationNumber: row.identificationNumber,
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

  async getCustomerByIdentification(identificationNumber: string): Promise<Customer | null> {
    const query = `
      SELECT
        c.id,
        c.idt_typ AS "identificationType",
        c.idt_num AS "identificationNumber",
        c.nam_cus AS "names",
        c.ema_cus AS "email",
        c.pho_cus AS "phone",
        c.add_cus AS "address",
        c.cre_at AS "createdAt",
        c.upd_at AS "updatedAt"
      FROM customers c
      WHERE c.idt_num = $1
      LIMIT 1;
    `;

    const result = await this.pool.query<CustomerRow>(query, [identificationNumber]);
    if (result.rows.length === 0) {
      return null;
    }

    return new Customer({
      identificationType: result.rows[0].identificationType as any,
      identificationNumber: result.rows[0].identificationNumber,
      names: result.rows[0].names,
      email: result.rows[0].email ?? undefined,
      phone: result.rows[0].phone ?? undefined,
      address: result.rows[0].address ?? undefined,
      createdAt: result.rows[0].createdAt,
      updatedAt: new Date(),
    });
  }
}
