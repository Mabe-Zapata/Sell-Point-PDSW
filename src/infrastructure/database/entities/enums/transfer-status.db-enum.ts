export enum TransferStatusDb {
  REQUESTED = 'REQUESTED',
  APPROVED = 'APPROVED',
  SENT = 'SENT',
  RECEIVED = 'RECEIVED',
  CANCELLED = 'CANCELLED',
}

import { TransferStatus } from '../../../../domain/entities/enums/transfer-status.enum';

export class TransferStatusMapper {
  static toDomain(db: TransferStatusDb): TransferStatus {
    switch (db) {
      case TransferStatusDb.REQUESTED:
        return TransferStatus.REQUESTED;
      case TransferStatusDb.APPROVED:
        return TransferStatus.APPROVED;
      case TransferStatusDb.SENT:
        return TransferStatus.SENT;
      case TransferStatusDb.RECEIVED:
        return TransferStatus.RECEIVED;
      case TransferStatusDb.CANCELLED:
        return TransferStatus.CANCELLED;
      default:
        throw new Error(`Unknown TransferStatusDb: ${db}`);
    }
  }

  static toDb(domain: TransferStatus): TransferStatusDb {
    switch (domain) {
      case TransferStatus.REQUESTED:
        return TransferStatusDb.REQUESTED;
      case TransferStatus.APPROVED:
        return TransferStatusDb.APPROVED;
      case TransferStatus.SENT:
        return TransferStatusDb.SENT;
      case TransferStatus.RECEIVED:
        return TransferStatusDb.RECEIVED;
      case TransferStatus.CANCELLED:
        return TransferStatusDb.CANCELLED;
      default:
        throw new Error(`Unknown TransferStatus: ${domain}`);
    }
  }
}
