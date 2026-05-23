export enum StockMovementTypeDb {
  IN = 'IN',
  OUT = 'OUT',
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
      case StockMovementType.SALE:
        return StockMovementTypeDb.SALE;
      case StockMovementType.ADJUSTMENT:
        return StockMovementTypeDb.ADJUSTMENT;
      default:
        throw new Error(`Unknown StockMovementType: ${domain}`);
    }
  }
}
