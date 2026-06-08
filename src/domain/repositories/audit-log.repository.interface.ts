import { AuditLog, AuditAction } from '../entities/audit-log.entity';
import { PaginationParams, PaginatedResult } from './pagination.types';

export interface AuditLogFilters {
  tableName?: string;
  action?: AuditAction;
  userId?: string;
  recordId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface AuditLogEntry {
  tableName: string;
  recordId: string;
  action: AuditAction;
  userId?: string;
  email?: string;
  rol?: string;
  changedColumns?: string[];
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

export interface AuditSummary {
  actionsPerDay: { date: string; count: number }[];
  activeUsers: { userId: string; email: string; count: number }[];
  topModifiedEntities: { tableName: string; count: number }[];
}

export interface IAuditLogRepository {
  save(entry: AuditLogEntry): Promise<void>;
  findById(id: string): Promise<AuditLog | null>;
  findAll(
    pagination: PaginationParams,
    filters: AuditLogFilters,
  ): Promise<PaginatedResult<AuditLog>>;
  getSummary(): Promise<AuditSummary>;
}
