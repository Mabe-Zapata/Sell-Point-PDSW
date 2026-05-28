 
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
 
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ISaleQueryService,
  SaleListItem,
  SaleWithDetails,
} from '../../../domain/query-services/sale.query-service.interface';
import { Sale, SaleDetail, Customer } from '../../../domain/entities';
import { SaleTypeOrmEntity } from '../../database/entities/sale.typeorm.entity';
import { SaleDetailTypeOrmEntity } from '../../database/entities/sale-detail.typeorm.entity';
import { CustomerTypeOrmEntity } from '../../database/entities/customer.typeorm.entity';
import { UserTypeOrmEntity } from '../../database/entities/user.typeorm.entity';

@Injectable()
export class SaleQueryService implements ISaleQueryService {
  constructor(
    @InjectRepository(SaleTypeOrmEntity)
    private readonly saleRepository: Repository<SaleTypeOrmEntity>,
    @InjectRepository(SaleDetailTypeOrmEntity)
    private readonly saleDetailRepository: Repository<SaleDetailTypeOrmEntity>,
  ) {}

  private buildSaleQuery() {
    return this.saleRepository
      .createQueryBuilder('sal')
      .innerJoin(CustomerTypeOrmEntity, 'cus', 'cus.id = sal.customerId')
      .innerJoin(UserTypeOrmEntity, 'usr', 'usr.id = sal.cashierUserId');
  }

  async listSales(params: {
    page: number;
    limit: number;
    branchId?: string;
    customerId?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<{ data: SaleListItem[]; total: number; page: number; limit: number }> {
    const { page, limit, branchId, customerId, status, startDate, endDate } = params;
    const offset = (page - 1) * limit;

    const baseQuery = this.buildSaleQuery()
      .where(branchId ? 'sal.branchId = :branchId' : '1=1', { branchId })
      .andWhere(customerId ? 'sal.customerId = :customerId' : '1=1', { customerId })
      .andWhere(status ? 'sal.status = :status' : '1=1', { status })
      .andWhere(startDate ? 'sal.createdAt >= :startDate' : '1=1', { startDate })
      .andWhere(endDate ? 'sal.createdAt <= :endDate' : '1=1', { endDate });

    const total = await baseQuery.clone().getCount();
    const rows = await baseQuery
      .clone()
      .select([
        'sal.id AS "id"',
        'sal.saleNumber AS "saleNumber"',
        'sal.status AS "status"',
        'sal.subtotal AS "subtotal"',
        'sal.taxAmount AS "taxAmount"',
        'sal.discountAmount AS "discountAmount"',
        'sal.total AS "total"',
        'sal.createdAt AS "createdAt"',
        'sal.branchId AS "branchId"',
        'sal.customerId AS "customerId"',
        'TRIM(COALESCE(cus."FIR_NAM_CUS", \'\') || \' \' || COALESCE(cus."APE_CUS", \'\')) AS "customerName"',
        'usr.username AS "cashierUsername"',
      ])
      .orderBy('sal.createdAt', 'DESC')
      .skip(offset)
      .take(limit)
      .getRawMany<SaleListItem>();

    return {
      data: rows.map((row) => ({
        ...row,
        subtotal: Number(row.subtotal),
        taxAmount: Number(row.taxAmount),
        discountAmount: Number(row.discountAmount),
        total: Number(row.total),
      })),
      total,
      page,
      limit,
    };
  }

  async getSaleWithDetails(id: string): Promise<SaleWithDetails | null> {
    const saleRow = await this.buildSaleQuery()
      .where('sal.id = :id', { id })
      .select([
        'sal.id AS "id"',
        'sal.branchId AS "branchId"',
        'sal.customerId AS "customerId"',
        'sal.cashierUserId AS "cashierUserId"',
        'sal.saleNumber AS "saleNumber"',
        'sal.status AS "status"',
        'sal.subtotal AS "subtotal"',
        'sal.taxAmount AS "taxAmount"',
        'sal.discountAmount AS "discountAmount"',
        'sal.total AS "total"',
        'sal.createdAt AS "createdAt"',
        'sal.updatedAt AS "updatedAt"',
        'cus.firstName AS "customerFirstName"',
        'cus.lastName AS "customerLastName"',
        'cus.cedula AS "customerCedula"',
        'cus.email AS "customerEmail"',
        'cus.phone AS "customerPhone"',
        'cus.address AS "customerAddress"',
        'TRIM(COALESCE(cus."FIR_NAM_CUS", \'\') || \' \' || COALESCE(cus."APE_CUS", \'\')) AS "customerName"',
        'usr.username AS "cashierUsername"',
      ])
      .getRawOne();

    if (!saleRow) {
      return null;
    }

    const detailsRows = await this.saleDetailRepository
      .createQueryBuilder('sd')
      .where('sd.saleId = :id', { id })
      .select([
        'sd.id AS "id"',
        'sd.saleId AS "saleId"',
        'sd.productId AS "productId"',
        'sd.productNameSnapshot AS "productName"',
        'sd.productCodeSnapshot AS "productCode"',
        'sd.quantity AS "quantity"',
        'sd.unitPrice AS "unitPrice"',
        'sd.taxRateId AS "taxRateId"',
        'sd.taxPercentage AS "taxPercentage"',
        'sd.taxAmount AS "taxAmount"',
        'sd.createdAt AS "createdAt"',
      ])
      .orderBy('sd.createdAt', 'ASC')
      .getRawMany();

    const customer = new Customer({
      id: saleRow.customerId,
      firstName: saleRow.customerFirstName ?? saleRow.customerName,
      lastName: saleRow.customerLastName ?? undefined,
      cedula: saleRow.customerCedula,
      email: saleRow.customerEmail ?? undefined,
      phone: saleRow.customerPhone ?? undefined,
      address: saleRow.customerAddress ?? undefined,
      isActive: true,
      createdAt: saleRow.createdAt,
      updatedAt: saleRow.updatedAt,
    });

    const sale = new Sale({
      id: saleRow.id,
      branchId: saleRow.branchId,
      customerId: saleRow.customerId,
      cashierUserId: saleRow.cashierUserId,
      saleNumber: saleRow.saleNumber,
      status: saleRow.status,
      subtotal: Number(saleRow.subtotal),
      taxAmount: Number(saleRow.taxAmount),
      discountAmount: Number(saleRow.discountAmount),
      total: Number(saleRow.total),
      createdAt: saleRow.createdAt,
      updatedAt: saleRow.updatedAt,
    });

    return Object.assign(sale, {
      customer,
      cashierUsername: saleRow.cashierUsername,
      details: detailsRows.map(
        (row) =>
          new SaleDetail({
            id: Number(row.id),
            saleId: row.saleId,
            productId: row.productId,
            productName: row.productName,
            productCode: row.productCode,
            quantity: Number(row.quantity),
            unitPrice: Number(row.unitPrice),
            taxRateId: row.taxRateId,
            taxPercentage: Number(row.taxPercentage),
            taxAmount: Number(row.taxAmount),
            createdAt: row.createdAt,
          }),
      ),
    });
  }
}
