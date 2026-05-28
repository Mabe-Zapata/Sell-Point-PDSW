import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginatedResult } from '../../../domain/repositories/pagination.types';
import {
  IInvoiceQueryService,
  InvoiceListItem,
} from '../../../domain/query-services/invoice.query-service.interface';
import { InvoiceTypeOrmEntity } from '../../database/entities/invoice.typeorm.entity';
import { InvoiceItemTypeOrmEntity } from '../../database/entities/invoice-item.typeorm.entity';
import { InvoiceSeriesTypeOrmEntity } from '../../database/entities/invoice-series.typeorm.entity';
import { SaleTypeOrmEntity } from '../../database/entities/sale.typeorm.entity';
import { CustomerTypeOrmEntity } from '../../database/entities/customer.typeorm.entity';

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
            .select('ii.invoiceId', 'invoiceId')
            .addSelect('SUM(ii.quantity * ii.unitPrice)', 'subtotal')
            .addSelect('SUM(COALESCE(ii.taxAmount, 0))', 'iva')
            .groupBy('ii.invoiceId'),
        'totals',
        'totals.invoiceId = i.id',
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
      'COALESCE(totals.subtotal, 0) AS "subtotal"',
      'COALESCE(totals.iva, 0) AS "iva"',
      '(COALESCE(totals.subtotal, 0) + COALESCE(totals.iva, 0)) AS "total"',
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
}
