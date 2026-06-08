import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AuditLog } from '../../../domain/entities/audit-log.entity';

export class AuditLogResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() tableName!: string;
  @ApiProperty() recordId!: string;
  @ApiProperty() action!: string;
  @ApiPropertyOptional() userId?: string;
  @ApiPropertyOptional() email?: string;
  @ApiPropertyOptional() rol?: string;
  @ApiPropertyOptional({ type: [String] }) changedColumns?: string[];
  @ApiPropertyOptional() oldValues?: Record<string, unknown>;
  @ApiPropertyOptional() newValues?: Record<string, unknown>;
  @ApiPropertyOptional() ip?: string;
  @ApiPropertyOptional() userAgent?: string;
  @ApiPropertyOptional() metadata?: Record<string, unknown>;
  @ApiProperty() createdAt!: Date;

  static fromEntity(log: AuditLog): AuditLogResponseDto {
    const dto = new AuditLogResponseDto();
    dto.id = log.id;
    dto.tableName = log.tableName;
    dto.recordId = log.recordId;
    dto.action = log.action;
    dto.userId = log.userId;
    dto.email = log.email;
    dto.rol = log.rol;
    dto.changedColumns = log.changedColumns;
    dto.oldValues = log.oldValues;
    dto.newValues = log.newValues;
    dto.ip = log.ip;
    dto.userAgent = log.userAgent;
    dto.metadata = log.metadata;
    dto.createdAt = log.createdAt;
    return dto;
  }
}