import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { AuditLogTypeOrmEntity } from '../database/entities/audit-log.typeorm.entity';
import { AuditLog, AuditAction } from '../../domain/entities/audit-log.entity';
import type {
  IAuditLogRepository,
  AuditLogEntry,
  AuditLogFilters,
  AuditSummary,
} from '../../domain/repositories/audit-log.repository.interface';
import type { PaginationParams, PaginatedResult } from '../../domain/repositories/pagination.types';

@Injectable()
export class AuditLogRepository implements IAuditLogRepository {
  constructor(
    @InjectRepository(AuditLogTypeOrmEntity)
    private readonly repo: Repository<AuditLogTypeOrmEntity>,
  ) {}

  private mapToDomain(entity: AuditLogTypeOrmEntity): AuditLog {
    return new AuditLog({
      id: entity.id,
      tableName: entity.tableName,
      recordId: entity.recordId,
      action: entity.action as AuditAction,
      userId: entity.userId,
      email: entity.email,
      rol: entity.rol,
      changedColumns: entity.changedColumns,
      oldValues: entity.oldValues,
      newValues: entity.newValues,
      ip: entity.ip,
      userAgent: entity.userAgent,
      metadata: entity.metadata,
      createdAt: entity.createdAt,
    });
  }

  async save(entry: AuditLogEntry): Promise<void> {
    const entity = this.repo.create({
      id: uuidv4(),
      tableName: entry.tableName,
      recordId: entry.recordId,
      action: entry.action,
      userId: entry.userId,
      email: entry.email,
      rol: entry.rol,
      changedColumns: entry.changedColumns,
      oldValues: entry.oldValues,
      newValues: entry.newValues,
      ip: entry.ip,
      userAgent: entry.userAgent,
      metadata: entry.metadata,
    });
    await this.repo.save(entity);
  }

  async findById(id: string): Promise<AuditLog | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? this.mapToDomain(entity) : null;
  }

  async findAll(
    pagination: PaginationParams,
    filters: AuditLogFilters = {},
  ): Promise<PaginatedResult<AuditLog>> {
    const { page, limit } = pagination;
    const qb = this.repo.createQueryBuilder('al');

    if (filters.tableName) {
      qb.andWhere('al.tableName = :tableName', { tableName: filters.tableName });
    }
    if (filters.action) {
      qb.andWhere('al.action = :action', { action: filters.action });
    }
    if (filters.userId) {
      qb.andWhere('al.userId = :userId', { userId: filters.userId });
    }
    if (filters.recordId) {
      qb.andWhere('al.recordId = :recordId', { recordId: filters.recordId });
    }
    if (filters.dateFrom) {
      qb.andWhere('al.createdAt >= :dateFrom', { dateFrom: filters.dateFrom });
    }
    if (filters.dateTo) {
      qb.andWhere('al.createdAt <= :dateTo', { dateTo: filters.dateTo });
    }

    qb.orderBy('al.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data: data.map((e) => this.mapToDomain(e)),
      total,
      page,
      limit,
    };
  }

  async getSummary(): Promise<AuditSummary> {
    const actionsPerDay: { date: string; count: number }[] = await this.repo
      .createQueryBuilder('al')
      .select("DATE(al.createdAt)", 'date')
      .addSelect('COUNT(*)', 'count')
      .where("al.createdAt >= NOW() - INTERVAL '30 days'")
      .groupBy("DATE(al.createdAt)")
      .orderBy("DATE(al.createdAt)", 'DESC')
      .getRawMany<{ date: string; count: string }>()
      .then((rows) =>
        rows.map((r) => ({ date: r.date, count: Number(r.count) })),
      );

    const activeUsers: { userId: string; email: string; count: number }[] = await this.repo
      .createQueryBuilder('al')
      .select('al.userId', 'userId')
      .addSelect('al.email', 'email')
      .addSelect('COUNT(*)', 'count')
      .where('al.userId IS NOT NULL')
      .andWhere("al.createdAt >= NOW() - INTERVAL '30 days'")
      .groupBy('al.userId')
      .addGroupBy('al.email')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany<{ userId: string; email: string; count: string }>()
      .then((rows) =>
        rows.map((r) => ({ userId: r.userId, email: r.email, count: Number(r.count) })),
      );

    const topModifiedEntities: { tableName: string; count: number }[] = await this.repo
      .createQueryBuilder('al')
      .select('al.tableName', 'tableName')
      .addSelect('COUNT(*)', 'count')
      .where("al.createdAt >= NOW() - INTERVAL '30 days'")
      .groupBy('al.tableName')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany<{ tableName: string; count: string }>()
      .then((rows) =>
        rows.map((r) => ({ tableName: r.tableName, count: Number(r.count) })),
      );

    return { actionsPerDay, activeUsers, topModifiedEntities };
  }
}
