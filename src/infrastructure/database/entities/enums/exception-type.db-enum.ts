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
  static toDomain(value: string | ExceptionTypeDb): ExceptionType {
    return ExceptionType[value as keyof typeof ExceptionType];
  }

  static toDb(domain: ExceptionType): string {
    return domain;
  }
}
