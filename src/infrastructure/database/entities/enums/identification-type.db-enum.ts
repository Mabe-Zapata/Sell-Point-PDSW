export enum IdentificationTypeDb {
  RUC = 'RUC',
  CEDULA = 'CEDULA',
  PASAPORTE = 'PASAPORTE',
  FOREIGN_ID = 'FOREIGN_ID',
  CONSUMIDOR_FINAL = 'CONSUMIDOR_FINAL',
}

import { IdentificationType } from '../../../../domain/entities/enums/identification-type.enum';

export class IdentificationTypeMapper {
  static toDomain(db: IdentificationTypeDb): IdentificationType {
    switch (db) {
      case IdentificationTypeDb.RUC:
        return IdentificationType.RUC;
      case IdentificationTypeDb.CEDULA:
        return IdentificationType.CEDULA;
      case IdentificationTypeDb.PASAPORTE:
        return IdentificationType.PASAPORTE;
      case IdentificationTypeDb.FOREIGN_ID:
        return IdentificationType.FOREIGN_ID;
      case IdentificationTypeDb.CONSUMIDOR_FINAL:
        return IdentificationType.CONSUMIDOR_FINAL;
      default:
        throw new Error(`Unknown IdentificationTypeDb: ${db}`);
    }
  }

  static toDb(domain: IdentificationType): IdentificationTypeDb {
    switch (domain) {
      case IdentificationType.RUC:
        return IdentificationTypeDb.RUC;
      case IdentificationType.CEDULA:
        return IdentificationTypeDb.CEDULA;
      case IdentificationType.PASAPORTE:
        return IdentificationTypeDb.PASAPORTE;
      case IdentificationType.FOREIGN_ID:
        return IdentificationTypeDb.FOREIGN_ID;
      case IdentificationType.CONSUMIDOR_FINAL:
        return IdentificationTypeDb.CONSUMIDOR_FINAL;
      default:
        throw new Error(`Unknown IdentificationType: ${domain}`);
    }
  }
}
