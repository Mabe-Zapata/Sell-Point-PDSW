import { ErrorLog } from '../../../domain/entities';

export class ErrorLogResponseDto {
  id!: number;
  exceptionType!: string;
  message!: string;
  stackTrace?: string;
  source?: string;
  userId?: string;
  createdAt!: Date;

  static fromEntity(log: ErrorLog): ErrorLogResponseDto {
    const dto = new ErrorLogResponseDto();
    dto.id = log.id;
    dto.exceptionType = log.exceptionType;
    dto.message = log.message;
    dto.stackTrace = log.stackTrace;
    dto.source = log.source;
    dto.userId = log.userId;
    dto.createdAt = log.createdAt;
    return dto;
  }
}