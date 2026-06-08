export enum SaleStatusDb {
  DRAFT = 'DRAFT',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
}

import { SaleStatus } from '../../../../domain/entities/enums/sale-status.enum';

export class SaleStatusMapper {
  static toDomain(value: string | SaleStatusDb): SaleStatus {
    return SaleStatus[value as keyof typeof SaleStatus];
  }

  static toDb(domain: SaleStatus): string {
    return domain;
  }
}
