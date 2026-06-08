import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
import { UserTypeOrmEntity } from '../../database/entities/user.typeorm.entity';
import { ProductTypeOrmEntity } from '../../database/entities/product.typeorm.entity';

@Injectable()
export class InvoiceQueryService implements IInvoiceQueryService {
  constructor(
    @InjectRepository(InvoiceTypeOrmEntity)
    private readonly invoiceRepository: Repository<InvoiceTypeOrmEntity>,
    @InjectRepository(InvoiceItemTypeOrmEntity)
    private readonly invoiceItemRepository: Repository<InvoiceItemTypeOrmEntity>,
  ) {}

  private async batchIds<T>(
    ids: string[],
    batchSize: number,
    fetchFn: (batch: string[]) => Promise<T[]>,
  ): Promise<T[]> {
    const results: T[] = [];
    for (let i = 0; i < ids.length; i += batchSize) {
      const batch = ids.slice(i, i + batchSize);
       
      const batchResults = await fetchFn(batch);
      results.push(...batchResults);
    }
    return results;
  }

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
      .leftJoin(CustomerTypeOrmEntity, 'cus', 'cus.id = sal.customerId')
      .leftJoin(UserTypeOrmEntity, 'usr', 'usr.id = sal.cashierUserId');
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
      'sal.customerId AS "customerId"',
      'ser.establishmentCode AS "establishmentCode"',
      'ser.emissionPointCode AS "emissionPointCode"',
      'COALESCE("totals"."SUBTOTAL", 0) AS "subtotal"',
      'COALESCE("totals"."IVA", 0) AS "iva"',
      '(COALESCE("totals"."SUBTOTAL", 0) + COALESCE("totals"."IVA", 0)) AS "total"',
      // Prefer audit snapshot over live JOIN for historical accuracy
      'COALESCE(i.customerNameSnapshot, TRIM(COALESCE(cus.firstName, \'\') || \' \' || COALESCE(cus.lastName, \'\'))) AS "customerName"',
      'COALESCE(i.customerCedulaSnapshot, cus.cedula) AS "customerCedula"',
      'COALESCE(i.customerEmailSnapshot, cus.email) AS "customerEmail"',
      // Resolved cashier values (COALESCE: snapshot > live JOIN)
      `COALESCE(i.cashierNameSnapshot, TRIM(COALESCE(usr.firstName, '') || ' ' || COALESCE(usr.lastName, ''))) AS "cashierName"`,
      `COALESCE(i.cashierUsernameSnapshot, usr.username) AS "cashierUsername"`,
      `COALESCE(i.cashierEmployeeIdSnapshot, usr.employeeId) AS "cashierEmployeeId"`,
      'sal.cashierUserId AS "cashierUserId"',
      // Raw snapshot columns (nullable — old invoices won't have them)
      'i.customerNameSnapshot AS "customerNameSnapshot"',
      'i.customerCedulaSnapshot AS "customerCedulaSnapshot"',
      'i.customerEmailSnapshot AS "customerEmailSnapshot"',
      'i.cashierNameSnapshot AS "cashierNameSnapshot"',
      'i.cashierUsernameSnapshot AS "cashierUsernameSnapshot"',
      'i.cashierEmployeeIdSnapshot AS "cashierEmployeeIdSnapshot"',
    ];
  }

  private normalizeRow(row: InvoiceListItem): InvoiceListItem {
    return {
      ...row,
      subtotal: Number(row.subtotal ?? 0),
      iva: Number(row.iva ?? 0),
      total: Number(row.total ?? (Number(row.subtotal ?? 0) + Number(row.iva ?? 0))),
      customerId: row.customerId ?? undefined,
      customerName: row.customerName ?? '',
      customerCedula: row.customerCedula ?? '',
      customerEmail: row.customerEmail ?? undefined,
      cashierUserId: row.cashierUserId ?? undefined,
      cashierName: row.cashierName ?? undefined,
      cashierUsername: row.cashierUsername ?? undefined,
      cashierEmployeeId: row.cashierEmployeeId ?? undefined,
      customerNameSnapshot: row.customerNameSnapshot ?? undefined,
      customerCedulaSnapshot: row.customerCedulaSnapshot ?? undefined,
      customerEmailSnapshot: row.customerEmailSnapshot ?? undefined,
      cashierNameSnapshot: row.cashierNameSnapshot ?? undefined,
      cashierUsernameSnapshot: row.cashierUsernameSnapshot ?? undefined,
      cashierEmployeeIdSnapshot: row.cashierEmployeeIdSnapshot ?? undefined,
    };
  }

  private readNumeric(row: Record<string, unknown> | undefined, key: string): number {
    const value = row?.[key] ?? row?.[key.toUpperCase()];
    const parsed = Number(value ?? 0);
    return Number.isFinite(parsed) ? parsed : 0;
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

  async listInvoiceHeaders(params: {
    branchId?: string | null;
    customerId?: string | null;
    status?: string | null;
    invoiceNumber?: string | null;
    startDate?: Date | null;
    endDate?: Date | null;
    limit: number;
    offset: number;
  }): Promise<InvoiceHeaderResult[]> {
    const { branchId, customerId, status, invoiceNumber, startDate, endDate, limit, offset } = params;

    const searchPattern = invoiceNumber ? `%${invoiceNumber}%` : null;
    const needsSaleJoin = Boolean(branchId) || Boolean(customerId);

    const filterQuery = this.invoiceRepository.createQueryBuilder('i');

    if (needsSaleJoin) {
      filterQuery.innerJoin(SaleTypeOrmEntity, 'sal', 'sal.id = i.saleId');
    }

    const pagedIds = await filterQuery
      .where(branchId ? 'sal.branchId = :branchId' : '1=1', { branchId })
      .andWhere(customerId ? 'sal.customerId = :customerId' : '1=1', { customerId })
      .andWhere(status ? 'i.status = :status' : '1=1', { status })
      .andWhere(searchPattern ? 'UPPER(i.invoiceNumber) LIKE UPPER(:searchPattern)' : '1=1', {
        searchPattern,
      })
      .andWhere(startDate ? 'i.createdAt >= :startDate' : '1=1', { startDate })
      .andWhere(endDate ? 'i.createdAt <= :endDate' : '1=1', { endDate })
      .select('i.id', 'id')
      .orderBy('i.createdAt', 'DESC')
      .offset(offset)
      .limit(limit)
      .getRawMany<{ id: string }>();

    const ids = pagedIds.map((row) => String(row.id));

    if (!ids.length) {
      return [];
    }

    const rows = await this.invoiceRepository
      .createQueryBuilder('i')
      .innerJoin(SaleTypeOrmEntity, 'sal', 'sal.id = i.saleId')
      .innerJoin(InvoiceSeriesTypeOrmEntity, 'ser', 'ser.id = i.seriesId')
      .leftJoin(CustomerTypeOrmEntity, 'cus', 'cus.id = sal.customerId')
      .leftJoin(UserTypeOrmEntity, 'usr', 'usr.id = sal.cashierUserId')
      .select([
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
        'sal.customerId AS "customerId"',
        'sal.total AS "totalAmount"',
        'ser.establishmentCode AS "establishmentCode"',
        'ser.emissionPointCode AS "emissionPointCode"',
        // Customer snapshots (COALESCE: prefer snapshot, fallback to live JOIN)
        `COALESCE(i.customerNameSnapshot, TRIM(COALESCE(cus.firstName, '') || ' ' || COALESCE(cus.lastName, ''))) AS "customerName"`,
        `COALESCE(i.customerCedulaSnapshot, cus.cedula) AS "customerCedula"`,
        `COALESCE(i.customerEmailSnapshot, cus.email) AS "customerEmail"`,
        // Cashier snapshots (resolved + raw, same pattern as customer fields)
        `COALESCE(i.cashierNameSnapshot, TRIM(COALESCE(usr.firstName, '') || ' ' || COALESCE(usr.lastName, ''))) AS "cashierName"`,
        `COALESCE(i.cashierUsernameSnapshot, usr.username) AS "cashierUsername"`,
        `COALESCE(i.cashierEmployeeIdSnapshot, usr.employeeId) AS "cashierEmployeeId"`,
        'sal.cashierUserId AS "cashierUserId"',
        'i.cashierNameSnapshot AS "cashierNameSnapshot"',
        'i.cashierUsernameSnapshot AS "cashierUsernameSnapshot"',
        'i.cashierEmployeeIdSnapshot AS "cashierEmployeeIdSnapshot"',
      ])
      .where('i.id IN (:...ids)', { ids })
      .getRawMany<InvoiceHeaderResult>();

    const rowsById = new Map(rows.map((row) => [String(row.id), row]));

    return ids
      .map((id) => rowsById.get(id))
      .filter((row): row is InvoiceHeaderResult => Boolean(row))
      .map((row) => ({
        ...row,
        totalAmount: Number(row.totalAmount),
      }));
  }

  async countInvoiceHeaders(params: {
    branchId?: string | null;
    customerId?: string | null;
    status?: string | null;
    invoiceNumber?: string | null;
    startDate?: Date | null;
    endDate?: Date | null;
  }): Promise<number> {
    const { branchId, customerId, status, invoiceNumber, startDate, endDate } = params;

    const searchPattern = invoiceNumber ? `%${invoiceNumber}%` : null;
    const needsSaleJoin = Boolean(branchId) || Boolean(customerId);

    const query = this.invoiceRepository.createQueryBuilder('i');

    if (needsSaleJoin) {
      query.innerJoin(SaleTypeOrmEntity, 'sal', 'sal.id = i.saleId');
    }

    return query
      .where(branchId ? 'sal.branchId = :branchId' : '1=1', { branchId })
      .andWhere(customerId ? 'sal.customerId = :customerId' : '1=1', { customerId })
      .andWhere(status ? 'i.status = :status' : '1=1', { status })
      .andWhere(searchPattern ? 'UPPER(i.invoiceNumber) LIKE UPPER(:searchPattern)' : '1=1', {
        searchPattern,
      })
      .andWhere(startDate ? 'i.createdAt >= :startDate' : '1=1', { startDate })
      .andWhere(endDate ? 'i.createdAt <= :endDate' : '1=1', { endDate })
      .getCount();
  }

  async listInvoiceItems(invoiceIds: string[]): Promise<InvoiceItemResult[]> {
    if (!invoiceIds.length) return [];

    return this.batchIds(invoiceIds, 1000, (batch) =>
      this.invoiceItemRepository
        .createQueryBuilder('ii')
        .leftJoin(ProductTypeOrmEntity, 'p', 'p.id = ii.productId')
        .where('ii.invoiceId IN (:...batch)', { batch })
        .select([
          'ii.id AS "id"',
          'ii.invoiceId AS "invoiceId"',
          'ii.quantity AS "quantity"',
          'ii.unitPrice AS "price"',
          // Use snapshot as historical record; fallback to live product name
          'COALESCE(ii.productNameSnapshot, p.name) AS "productName"',
          'ii.productNameSnapshot AS "productNameSnapshot"',
          'ii.taxPercentage AS "taxPercentage"',
          'ii.taxAmount AS "taxAmount"',
        ])
        .getRawMany<InvoiceItemResult>(),
    );
  }

  async listInvoiceTotals(invoiceIds: string[]): Promise<InvoiceTotalResult[]> {
    if (!invoiceIds.length) return [];

    return this.batchIds(invoiceIds, 1000, (batch) =>
      this.invoiceItemRepository
        .createQueryBuilder('ii')
        .select([
          'ii.invoiceId AS "invoiceId"',
          'SUM(ii.quantity * ii.unitPrice) AS "subtotal"',
          'SUM(COALESCE(ii.taxAmount, 0)) AS "iva"',
        ])
        .where('ii.invoiceId IN (:...batch)', { batch })
        .groupBy('ii.invoiceId')
        .getRawMany<InvoiceTotalResult>()
    );
  }
}
