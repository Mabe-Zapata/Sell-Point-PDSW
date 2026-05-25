/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-enum-comparison */
export enum PostgresErrorCode {
  UNIQUE_VIOLATION = '23505',
  FOREIGN_KEY_VIOLATION = '23503',
  NOT_NULL_VIOLATION = '23502',
  CHECK_VIOLATION = '23514',
}

export enum DomainErrorType {
  CONFLICT = 'ConflictError',
  INVALID_REFERENCE = 'InvalidReferenceError',
  VALIDATION = 'ValidationError',
  BUSINESS_RULE = 'BusinessRuleError',
}

export interface DomainError {
  type: DomainErrorType;
  message: string;
  code?: string;
  detail?: string;
}

export class PostgresErrorMapper {
  static toDomain(
    sqlState: string,
    detail?: string,
  ): DomainError {
    switch (sqlState) {
      case PostgresErrorCode.UNIQUE_VIOLATION:
        return {
          type: DomainErrorType.CONFLICT,
          message: 'A record with this value already exists',
          code: sqlState,
          detail,
        };

      case PostgresErrorCode.FOREIGN_KEY_VIOLATION:
        return {
          type: DomainErrorType.INVALID_REFERENCE,
          message: 'Referenced record does not exist',
          code: sqlState,
          detail,
        };

      case PostgresErrorCode.NOT_NULL_VIOLATION:
        return {
          type: DomainErrorType.VALIDATION,
          message: 'Required field is missing',
          code: sqlState,
          detail,
        };

      case PostgresErrorCode.CHECK_VIOLATION:
        return {
          type: DomainErrorType.BUSINESS_RULE,
          message: 'Business rule violation',
          code: sqlState,
          detail,
        };

      default:
        return {
          type: DomainErrorType.VALIDATION,
          message: 'Database error occurred',
          code: sqlState,
          detail,
        };
    }
  }

  static isPostgresError(error: any): boolean {
    return error && typeof error.code === 'string' && error.code.length === 5;
  }
}