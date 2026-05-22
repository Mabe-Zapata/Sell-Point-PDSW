export enum StockMovementTypeDb {
  IN = 'IN',
  OUT = 'OUT',
  TRANSFER_IN = 'TRANSFER_IN',
  TRANSFER_OUT = 'TRANSFER_OUT',
  SALE = 'SALE',
  ADJUSTMENT = 'ADJUSTMENT',
}

import { StockMovementType } from '../../../../domain/entities/enums/stock-movement-type.enum';

export class StockMovementTypeMapper {
  static toDomain(db: StockMovementTypeDb): StockMovementType {
    switch (db) {
      case StockMovementTypeDb.IN:
        return StockMovementType.IN;
      case StockMovementTypeDb.OUT:
        return StockMovementType.OUT;
      case StockMovementTypeDb.TRANSFER_IN:
        return StockMovementType.TRANSFER_IN;
      case StockMovementTypeDb.TRANSFER_OUT:
        return StockMovementType.TRANSFER_OUT;
      case StockMovementTypeDb.SALE:
        return StockMovementType.SALE;
      case StockMovementTypeDb.ADJUSTMENT:
        return StockMovementType.ADJUSTMENT;
      default:
        throw new Error(`Unknown StockMovementTypeDb: ${db}`);
    }
  }

  static toDb(domain: StockMovementType): StockMovementTypeDb {
    switch (domain) {
      case StockMovementType.IN:
        return StockMovementTypeDb.IN;
      case StockMovementType.OUT:
        return StockMovementTypeDb.OUT;
      case StockMovementType.TRANSFER_IN:
        return StockMovementTypeDb.TRANSFER_IN;
      case StockMovementType.TRANSFER_OUT:
        return StockMovementTypeDb.TRANSFER_OUT;
      case StockMovementType.SALE:
        return StockMovementTypeDb.SALE;
      case StockMovementType.ADJUSTMENT:
        return StockMovementTypeDb.ADJUSTMENT;
      default:
        throw new Error(`Unknown StockMovementType: ${domain}`);
    }
  }
}
