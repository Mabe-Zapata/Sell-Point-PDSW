export enum InvoiceStatusDb {
  ISSUED = 'ISSUED',
  CANCELLED = 'CANCELLED',
}

import { InvoiceStatus } from '../../../../domain/entities/enums/invoice-status.enum';

export class InvoiceStatusMapper {
  static toDomain(value: string | InvoiceStatusDb): InvoiceStatus {
    return InvoiceStatus[value as keyof typeof InvoiceStatus];
  }

  static toDb(domain: InvoiceStatus): string {
    return domain;
  }
}
