export enum StockMovementTypeDb {
  IN = 'IN',
  OUT = 'OUT',
  SALE = 'SALE',
  ADJUSTMENT = 'ADJUSTMENT',
  TRANSFER_IN = 'TRANSFER_IN',
  TRANSFER_OUT = 'TRANSFER_OUT',
}

import { StockMovementType } from '../../../../domain/entities/enums/stock-movement-type.enum';

export class StockMovementTypeMapper {
  static toDomain(value: string | StockMovementTypeDb): StockMovementType {
    return StockMovementType[value as keyof typeof StockMovementType];
  }

  static toDb(domain: StockMovementType): string {
    return domain;
  }
}
