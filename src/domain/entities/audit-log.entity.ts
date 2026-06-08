export enum AuditAction {
  INSERT = 'INSERT',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}

export class AuditLog {
  id!: string;
  tableName!: string;
  recordId!: string;
  action!: AuditAction;
  userId?: string;
  email?: string;
  rol?: string;
  changedColumns?: string[];
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  createdAt!: Date;

  constructor(partial: Partial<AuditLog>) {
    Object.assign(this, partial);
  }
}
