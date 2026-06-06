import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InvoiceAuditLogTypeOrmEntity, InvoiceAuditActionDb } from '../database/entities/invoice-audit-log.typeorm.entity';
import type { IInvoiceAuditLogRepository, InvoiceAuditLogEntry } from '../../domain/repositories/invoice-audit-log.repository.interface';

@Injectable()
export class InvoiceAuditLogRepository implements IInvoiceAuditLogRepository {
  constructor(
    @InjectRepository(InvoiceAuditLogTypeOrmEntity)
    private readonly repo: Repository<InvoiceAuditLogTypeOrmEntity>,
  ) {}

  async log(entry: InvoiceAuditLogEntry): Promise<InvoiceAuditLogTypeOrmEntity> {
    const logEntry = this.repo.create({
      invoiceId: entry.invoiceId,
      actionType: entry.action,
      userId: entry.userId,
      userName: entry.userName,
      employeeId: entry.employeeId,
      detailsOld: entry.detailsOld,
      detailsNew: entry.detailsNew,
      ipAddress: entry.ipAddress,
      userAgent: entry.userAgent,
    });
    return this.repo.save(logEntry);
  }

  async findByInvoiceId(invoiceId: string): Promise<InvoiceAuditLogTypeOrmEntity[]> {
    return this.repo.find({
      where: { invoiceId },
      order: { createdAt: 'DESC' },
    });
  }

  async findByUserId(userId: string): Promise<InvoiceAuditLogTypeOrmEntity[]> {
    return this.repo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findByAction(invoiceId: string, action: string): Promise<InvoiceAuditLogTypeOrmEntity[]> {
    return this.repo.find({
      where: { invoiceId, actionType: action },
      order: { createdAt: 'DESC' },
    });
  }
}
