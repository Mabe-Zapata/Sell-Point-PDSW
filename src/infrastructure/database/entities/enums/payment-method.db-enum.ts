export enum PaymentMethodDb {
  CASH = 'CASH',
}

import { PaymentMethod } from '../../../../domain/entities/enums/payment-method.enum';

export class PaymentMethodMapper {
  static toDomain(db: PaymentMethodDb): PaymentMethod {
    switch (db) {
      case PaymentMethodDb.CASH:
        return PaymentMethod.CASH;
    }
  }

  static toDb(domain: PaymentMethod): PaymentMethodDb {
    switch (domain) {
      case PaymentMethod.CASH:
        return PaymentMethodDb.CASH;
    }
  }
}