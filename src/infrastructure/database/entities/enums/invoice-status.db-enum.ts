export enum InvoiceStatusDb {
  ISSUED = 'ISSUED',
  CANCELLED = 'CANCELLED',
}

import { InvoiceStatus } from '../../../../domain/entities/enums/invoice-status.enum';

export class InvoiceStatusMapper {
  static toDomain(db: InvoiceStatusDb): InvoiceStatus {
    switch (db) {
      case InvoiceStatusDb.ISSUED:
        return InvoiceStatus.ISSUED;
      case InvoiceStatusDb.CANCELLED:
        return InvoiceStatus.CANCELLED;
      default:
        throw new Error(`Unknown InvoiceStatusDb: ${db}`);
    }
  }

  static toDb(domain: InvoiceStatus): InvoiceStatusDb {
    switch (domain) {
      case InvoiceStatus.ISSUED:
        return InvoiceStatusDb.ISSUED;
      case InvoiceStatus.CANCELLED:
        return InvoiceStatusDb.CANCELLED;
      default:
        throw new Error(`Unknown InvoiceStatus: ${domain}`);
    }
  }
}
