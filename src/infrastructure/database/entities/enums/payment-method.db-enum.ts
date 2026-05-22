export enum PaymentMethodDb {
  CASH = 'CASH',
  CARD = 'CARD',
  TRANSFER = 'TRANSFER',
}

import { PaymentMethod } from '../../../../domain/entities/enums/payment-method.enum';

export class PaymentMethodMapper {
  static toDomain(db: PaymentMethodDb): PaymentMethod {
    switch (db) {
      case PaymentMethodDb.CASH:
        return PaymentMethod.CASH;
      case PaymentMethodDb.CARD:
        return PaymentMethod.CARD;
      case PaymentMethodDb.TRANSFER:
        return PaymentMethod.TRANSFER;
      default:
        throw new Error(`Unknown PaymentMethodDb: ${db}`);
    }
  }

  static toDb(domain: PaymentMethod): PaymentMethodDb {
    switch (domain) {
      case PaymentMethod.CASH:
        return PaymentMethodDb.CASH;
      case PaymentMethod.CARD:
        return PaymentMethodDb.CARD;
      case PaymentMethod.TRANSFER:
        return PaymentMethodDb.TRANSFER;
      default:
        throw new Error(`Unknown PaymentMethod: ${domain}`);
    }
  }
}
