import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginatedResult } from '../../../domain/repositories/pagination.types';
import {
  IInvoiceQueryService,
  InvoiceKpis,
  InvoiceListItem,
  InvoiceHeaderResult,
  InvoiceItemResult,
  InvoiceTotalResult,
} from '../../../domain/query-services/invoice.query-service.interface';
import { InvoiceTypeOrmEntity } from '../../database/entities/invoice.typeorm.entity';
import { InvoiceItemTypeOrmEntity } from '../../database/entities/invoice-item.typeorm.entity';
import { InvoiceSeriesTypeOrmEntity } from '../../database/entities/invoice-series.typeorm.entity';
import { SaleTypeOrmEntity } from '../../database/entities/sale.typeorm.entity';
import { CustomerTypeOrmEntity } from '../../database/entities/customer.typeorm.entity';
import { ProductTypeOrmEntity } from '../../database/entities/product.typeorm.entity';

@Injectable()
export class InvoiceQueryService implements IInvoiceQueryService {
  constructor(
    @InjectRepository(InvoiceTypeOrmEntity)
    private readonly invoiceRepository: Repository<InvoiceTypeOrmEntity>,
  ) {}

  private buildInvoiceQuery() {
    return this.invoiceRepository
      .createQueryBuilder('i')
      .innerJoin(SaleTypeOrmEntity, 'sal', 'sal.id = i.saleId')
      .innerJoin(InvoiceSeriesTypeOrmEntity, 'ser', 'ser.id = i.seriesId')
      .leftJoin(
        (qb) =>
          qb
            .from(InvoiceItemTypeOrmEntity, 'ii')
            .select('ii.invoiceId', 'INVOICE_ID')
            .addSelect('SUM(ii.quantity * ii.unitPrice)', 'SUBTOTAL')
            .addSelect('SUM(COALESCE(ii.taxAmount, 0))', 'IVA')
            .groupBy('ii.invoiceId'),
        'totals',
        '"totals"."INVOICE_ID" = i.id',
      )
      .leftJoin(CustomerTypeOrmEntity, 'cus', 'cus.id = sal.customerId');
  }

  private invoiceSelect() {
    return [
      'i.id AS "id"',
      'i.saleId AS "saleId"',
      'i.seriesId AS "seriesId"',
      'i.invoiceNumber AS "invoiceNumber"',
      'i.authorizationNumber AS "authorizationNumber"',
      'i.issueDate AS "issueDate"',
      'i.status AS "status"',
      'i.cancelledAt AS "cancelledAt"',
      'i.createdAt AS "createdAt"',
      'sal.saleNumber AS "saleNumber"',
      'ser.establishmentCode AS "establishmentCode"',
      'ser.emissionPointCode AS "emissionPointCode"',
      'COALESCE("totals"."SUBTOTAL", 0) AS "subtotal"',
      'COALESCE("totals"."IVA", 0) AS "iva"',
      '(COALESCE("totals"."SUBTOTAL", 0) + COALESCE("totals"."IVA", 0)) AS "total"',
      'TRIM(COALESCE(cus.firstName, \'\') || \' \' || COALESCE(cus.lastName, \'\')) AS "customerName"',
      'cus.cedula AS "customerCedula"',
      'cus.email AS "customerEmail"',
    ];
  }

  private normalizeRow(row: InvoiceListItem): InvoiceListItem {
    return {
      ...row,
      subtotal: Number(row.subtotal),
      iva: Number(row.iva),
      total: Number(row.total),
      customerName: row.customerName ?? '',
      customerCedula: row.customerCedula ?? '',
      customerEmail: row.customerEmail ?? undefined,
    };
  }

  private readNumeric(row: Record<string, unknown> | undefined, key: string): number {
    const value = row?.[key] ?? row?.[key.toUpperCase()];
    const parsed = Number(value ?? 0);
    return Number.isFinite(parsed) ? parsed : 0;
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

    const baseQuery = this.buildInvoiceQuery()
      .where(branchId ? 'ser.branchId = :branchId' : '1=1', { branchId })
      .andWhere(status ? 'i.status = :status' : '1=1', { status })
      .andWhere(
        searchPattern ? 'LOWER(i.invoiceNumber) LIKE LOWER(:searchPattern)' : '1=1',
        { searchPattern },
      )
      .andWhere(startDate ? 'i.createdAt >= :startDate' : '1=1', { startDate })
      .andWhere(endDate ? 'i.createdAt <= :endDate' : '1=1', { endDate });

    const total = await baseQuery.clone().getCount();
    const rows = await baseQuery
      .clone()
      .select(this.invoiceSelect())
      .orderBy('i.createdAt', 'DESC')
      .skip(offset)
      .take(limit)
      .getRawMany<InvoiceListItem>();

    return {
      data: rows.map((row) => this.normalizeRow(row)),
      total,
      page,
      limit,
    };
  }

  async getInvoiceBySaleId(saleId: string): Promise<InvoiceListItem | null> {
    const row = await this.buildInvoiceQuery()
      .where('i.saleId = :saleId', { saleId })
      .select(this.invoiceSelect())
      .getRawOne<InvoiceListItem>();

    if (!row) {
      return null;
    }

    return this.normalizeRow(row);
  }

  async getInvoiceById(id: string): Promise<InvoiceListItem | null> {
    const row = await this.buildInvoiceQuery()
      .where('i.id = :id', { id })
      .select(this.invoiceSelect())
      .getRawOne<InvoiceListItem>();

    if (!row) {
      return null;
    }

    return this.normalizeRow(row);
  }

  async getInvoiceKpis(params: { branchId?: string } = {}): Promise<InvoiceKpis> {
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);
    last30Days.setHours(0, 0, 0, 0);

    const row = await this.buildInvoiceQuery()
      .where(params.branchId ? 'ser.branchId = :branchId' : '1=1', {
        branchId: params.branchId,
      })
      .select([
        `SUM(CASE WHEN i.status <> :cancelledStatus THEN COALESCE("totals"."SUBTOTAL", 0) + COALESCE("totals"."IVA", 0) ELSE 0 END) AS "totalInvoiced"`,
        `SUM(CASE WHEN i.status <> :cancelledStatus THEN 1 ELSE 0 END) AS "issuedCount"`,
        `SUM(CASE WHEN i.status = :cancelledStatus THEN COALESCE("totals"."SUBTOTAL", 0) + COALESCE("totals"."IVA", 0) ELSE 0 END) AS "cancelledTotal"`,
        `SUM(CASE WHEN i.status = :cancelledStatus THEN 1 ELSE 0 END) AS "cancelledCount"`,
        `SUM(CASE WHEN i.status <> :cancelledStatus AND i.issueDate >= :last30Days THEN COALESCE("totals"."SUBTOTAL", 0) + COALESCE("totals"."IVA", 0) ELSE 0 END) AS "last30DaysTotal"`,
        `SUM(CASE WHEN i.status <> :cancelledStatus AND i.issueDate >= :last30Days THEN 1 ELSE 0 END) AS "last30DaysCount"`,
      ])
      .setParameters({
        cancelledStatus: 'CANCELLED',
        last30Days,
      })
      .getRawOne<Record<string, unknown>>();

    return {
      totalInvoiced: this.readNumeric(row, 'totalInvoiced'),
      issuedCount: this.readNumeric(row, 'issuedCount'),
      cancelledTotal: this.readNumeric(row, 'cancelledTotal'),
      cancelledCount: this.readNumeric(row, 'cancelledCount'),
      last30DaysTotal: this.readNumeric(row, 'last30DaysTotal'),
      last30DaysCount: this.readNumeric(row, 'last30DaysCount'),
    };
  }

  async listInvoiceHeaders(
    customerId: string | null,
    startDate: Date | null,
    endDate: Date | null,
    limit: number,
    offset: number,
  ): Promise<InvoiceHeaderResult[]> {
    return this.invoiceRepository
      .createQueryBuilder('i')
      .innerJoin(SaleTypeOrmEntity, 'sal', 'sal.id = i.saleId')
      .leftJoin(CustomerTypeOrmEntity, 'cus', 'cus.id = sal.customerId')
      .where(customerId ? 'sal.customerId = :customerId' : '1=1', { customerId })
      .andWhere(startDate ? 'i.createdAt >= :startDate' : '1=1', { startDate })
      .andWhere(endDate ? 'i.createdAt <= :endDate' : '1=1', { endDate })
      .select([
        'i.id AS "id"',
        'i.invoiceNumber AS "invoiceNumber"',
        'i.totalAmount AS "totalAmount"',
        'i.createdAt AS "createdAt"',
        'TRIM(COALESCE(cus.firstName, \'\') || \' \' || COALESCE(cus.lastName, \'\')) AS "customerName"',
      ])
      .orderBy('i.createdAt', 'DESC')
      .skip(offset)
      .take(limit)
      .getRawMany<InvoiceHeaderResult>();
  }

  async listInvoiceItems(invoiceIds: string[]): Promise<InvoiceItemResult[]> {
    if (!invoiceIds.length) return [];

    return this.invoiceRepository
      .createQueryBuilder('ii')
      .innerJoin(ProductTypeOrmEntity, 'p', 'p.id = ii.productId')
      .where('ii.invoiceId IN (:...invoiceIds)', { invoiceIds })
      .select([
        'ii.id AS "id"',
        'ii.invoiceId AS "invoiceId"',
        'ii.quantity AS "quantity"',
        'ii.unitPrice AS "price"',
        'p.name AS "productName"',
      ])
      .getRawMany<InvoiceItemResult>();
  }

  async listInvoiceTotals(invoiceIds: string[]): Promise<InvoiceTotalResult[]> {
    if (!invoiceIds.length) return [];

    return this.invoiceRepository
      .createQueryBuilder('ii')
      .select([
        'ii.invoiceId AS "invoiceId"',
        'SUM(ii.quantity * ii.unitPrice) AS "subtotal"',
        'SUM(COALESCE(ii.taxAmount, 0)) AS "iva"',
      ])
      .where('ii.invoiceId IN (:...invoiceIds)', { invoiceIds })
      .groupBy('ii.invoiceId')
      .getRawMany<InvoiceTotalResult>();
  }
}
