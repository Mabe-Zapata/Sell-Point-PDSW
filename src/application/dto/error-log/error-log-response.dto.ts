import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ErrorLog } from '../../../domain/entities';

export class ErrorLogResponseDto {
  @ApiProperty({ description: 'ID del registro de error' })
  id!: number;

  @ApiProperty({ description: 'Tipo de excepción' })
  exceptionType!: string;

  @ApiProperty({ description: 'Mensaje del error' })
  message!: string;

  @ApiPropertyOptional({ description: 'Stack trace completo' })
  stackTrace?: string;

  @ApiPropertyOptional({ description: 'Fuente del error' })
  source?: string;

  @ApiPropertyOptional({ description: 'ID del usuario que originó el error' })
  userId?: string;

  @ApiProperty({ description: 'Fecha y hora del error' })
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