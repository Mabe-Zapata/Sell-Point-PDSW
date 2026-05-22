export enum ExceptionTypeDb {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  BUSINESS_RULE_ERROR = 'BUSINESS_RULE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  UNEXPECTED_ERROR = 'UNEXPECTED_ERROR',
}

import { ExceptionType } from '../../../../domain/entities/enums/exception-type.enum';

export class ExceptionTypeMapper {
  static toDomain(db: ExceptionTypeDb): ExceptionType {
    switch (db) {
      case ExceptionTypeDb.VALIDATION_ERROR:
        return ExceptionType.VALIDATION_ERROR;
      case ExceptionTypeDb.DATABASE_ERROR:
        return ExceptionType.DATABASE_ERROR;
      case ExceptionTypeDb.AUTHENTICATION_ERROR:
        return ExceptionType.AUTHENTICATION_ERROR;
      case ExceptionTypeDb.AUTHORIZATION_ERROR:
        return ExceptionType.AUTHORIZATION_ERROR;
      case ExceptionTypeDb.BUSINESS_RULE_ERROR:
        return ExceptionType.BUSINESS_RULE_ERROR;
      case ExceptionTypeDb.EXTERNAL_SERVICE_ERROR:
        return ExceptionType.EXTERNAL_SERVICE_ERROR;
      case ExceptionTypeDb.UNEXPECTED_ERROR:
        return ExceptionType.UNEXPECTED_ERROR;
      default:
        throw new Error(`Unknown ExceptionTypeDb: ${db}`);
    }
  }

  static toDb(domain: ExceptionType): ExceptionTypeDb {
    switch (domain) {
      case ExceptionType.VALIDATION_ERROR:
        return ExceptionTypeDb.VALIDATION_ERROR;
      case ExceptionType.DATABASE_ERROR:
        return ExceptionTypeDb.DATABASE_ERROR;
      case ExceptionType.AUTHENTICATION_ERROR:
        return ExceptionTypeDb.AUTHENTICATION_ERROR;
      case ExceptionType.AUTHORIZATION_ERROR:
        return ExceptionTypeDb.AUTHORIZATION_ERROR;
      case ExceptionType.BUSINESS_RULE_ERROR:
        return ExceptionTypeDb.BUSINESS_RULE_ERROR;
      case ExceptionType.EXTERNAL_SERVICE_ERROR:
        return ExceptionTypeDb.EXTERNAL_SERVICE_ERROR;
      case ExceptionType.UNEXPECTED_ERROR:
        return ExceptionTypeDb.UNEXPECTED_ERROR;
      default:
        throw new Error(`Unknown ExceptionType: ${domain}`);
    }
  }
}
