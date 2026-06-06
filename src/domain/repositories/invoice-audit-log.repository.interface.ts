export type InvoiceAuditAction = 'PRINT' | 'ALTER' | 'CANCEL' | 'RESEND_EMAIL' | 'CREATE';

export interface InvoiceAuditLogEntry {
  invoiceId: string;
  action: InvoiceAuditAction;
  userId: string;
  userName: string;
  employeeId?: string;
  detailsOld?: Record<string, unknown>;
  detailsNew?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export interface IInvoiceAuditLogRepository {
  log(entry: InvoiceAuditLogEntry): Promise<unknown>;
  findByInvoiceId(invoiceId: string): Promise<unknown[]>;
  findByUserId(userId: string): Promise<unknown[]>;
  findByAction(invoiceId: string, action: InvoiceAuditAction): Promise<unknown[]>;
}
