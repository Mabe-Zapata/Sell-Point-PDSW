export enum SaleStatusDb {
  DRAFT = 'DRAFT',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
}

import { SaleStatus } from '../../../../domain/entities/enums/sale-status.enum';

export class SaleStatusMapper {
  static toDomain(db: SaleStatusDb): SaleStatus {
    switch (db) {
      case SaleStatusDb.DRAFT:
        return SaleStatus.DRAFT;
      case SaleStatusDb.CONFIRMED:
        return SaleStatus.CONFIRMED;
      case SaleStatusDb.CANCELLED:
        return SaleStatus.CANCELLED;
      default:
        throw new Error(`Unknown SaleStatusDb: ${db}`);
    }
  }

  static toDb(domain: SaleStatus): SaleStatusDb {
    switch (domain) {
      case SaleStatus.DRAFT:
        return SaleStatusDb.DRAFT;
      case SaleStatus.CONFIRMED:
        return SaleStatusDb.CONFIRMED;
      case SaleStatus.CANCELLED:
        return SaleStatusDb.CANCELLED;
      default:
        throw new Error(`Unknown SaleStatus: ${domain}`);
    }
  }
}
