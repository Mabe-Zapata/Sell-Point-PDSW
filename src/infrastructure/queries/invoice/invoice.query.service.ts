/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginatedResult } from '../../../domain/repositories/pagination.types';
import {
  IInvoiceQueryService,
  InvoiceListItem,
} from '../../../domain/query-services/invoice.query-service.interface';
import { InvoiceTypeOrmEntity } from '../../database/entities/invoice.typeorm.entity';
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
      .innerJoin(CustomerTypeOrmEntity, 'cus', 'cus.id = sal.customerId');
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
        'ser.establishmentCode AS "establishmentCode"',
        'ser.emissionPointCode AS "emissionPointCode"',
        'sal.total AS "total"',
        'TRIM(COALESCE(cus."FIR_NAM_CUS", \'\') || \' \' || COALESCE(cus."APE_CUS", \'\')) AS "customerName"',
        'cus.cedula AS "customerCedula"',
      ])
      .orderBy('i.createdAt', 'DESC')
      .skip(offset)
      .take(limit)
      .getRawMany<InvoiceListItem>();

    return {
      data: rows.map((row) => ({
        ...row,
        total: Number(row.total),
      })),
      total,
      page,
      limit,
    };
  }

  async getInvoiceBySaleId(saleId: string): Promise<InvoiceListItem | null> {
    const row = await this.buildInvoiceQuery()
      .where('i.saleId = :saleId', { saleId })
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
        'ser.establishmentCode AS "establishmentCode"',
        'ser.emissionPointCode AS "emissionPointCode"',
        'sal.total AS "total"',
        'TRIM(COALESCE(cus."FIR_NAM_CUS", \'\') || \' \' || COALESCE(cus."APE_CUS", \'\')) AS "customerName"',
        'cus.cedula AS "customerCedula"',
      ])
      .getRawOne<InvoiceListItem>();

    if (!row) {
      return null;
    }

    return {
      ...row,
      total: Number(row.total),
    };
  }

  async getInvoiceById(id: string): Promise<InvoiceListItem | null> {
    const row = await this.buildInvoiceQuery()
      .where('i.id = :id', { id })
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
        'ser.establishmentCode AS "establishmentCode"',
        'ser.emissionPointCode AS "emissionPointCode"',
        'sal.total AS "total"',
        'TRIM(COALESCE(cus."FIR_NAM_CUS", \'\') || \' \' || COALESCE(cus."APE_CUS", \'\')) AS "customerName"',
        'cus.cedula AS "customerCedula"',
      ])
      .getRawOne<InvoiceListItem>();

    if (!row) {
      return null;
    }

    return {
      ...row,
      total: Number(row.total),
    };
  }
}
