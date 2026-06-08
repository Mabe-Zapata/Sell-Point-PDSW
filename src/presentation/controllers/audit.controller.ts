import {
  Controller,
  Get,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ListAuditLogsQuery } from '../../application/cqrs/audit/queries/list-audit-logs/list-audit-logs.query';
import { GetAuditLogQuery } from '../../application/cqrs/audit/queries/get-audit-log/get-audit-log.query';
import { GetAuditSummaryQuery } from '../../application/cqrs/audit/queries/get-audit-summary/get-audit-summary.query';
import { AuditLogResponseDto } from '../../application/dto/audit/audit-log-response.dto';
import { AuditLog, AuditAction } from '../../domain/entities/audit-log.entity';
import { AuditSummary } from '../../domain/repositories/audit-log.repository.interface';
import { PaginatedResult } from '../../domain/repositories/pagination.types';
import { Roles } from '../decorators/roles.decorator';
import { PaginationQueryDto } from '../dto/pagination/pagination-query.dto';

@ApiTags('audit')
@ApiBearerAuth('access-token')
@Roles('ADMIN')
@Controller('audit')
export class AuditController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar registros de auditoría con filtros (solo ADMIN)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'tableName', required: false, type: String })
  @ApiQuery({ name: 'action', required: false, enum: AuditAction })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'recordId', required: false, type: String })
  @ApiQuery({ name: 'dateFrom', required: false, type: String, description: 'ISO date string' })
  @ApiQuery({ name: 'dateTo', required: false, type: String, description: 'ISO date string' })
  @ApiResponse({ status: 200, type: AuditLogResponseDto, isArray: true })
  async findAll(
    @Query() paginationQuery: PaginationQueryDto,
    @Query('tableName') tableName?: string,
    @Query('action') action?: AuditAction,
    @Query('userId') userId?: string,
    @Query('recordId') recordId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ): Promise<{ data: AuditLogResponseDto[]; total: number; page: number; limit: number }> {
    const result = await this.queryBus.execute<ListAuditLogsQuery, PaginatedResult<AuditLog>>(
      new ListAuditLogsQuery(
        { page: paginationQuery.page ?? 1, limit: paginationQuery.limit ?? 50 },
        tableName,
        action,
        userId,
        recordId,
        dateFrom ? new Date(dateFrom) : undefined,
        dateTo ? new Date(dateTo) : undefined,
      ),
    );

    return {
      data: result.data.map((log) => AuditLogResponseDto.fromEntity(log)),
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }

  @Get('summary')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resumen de auditoría: acciones/día, usuarios activos, entidades más modificadas (solo ADMIN)' })
  @ApiResponse({ status: 200 })
  async getSummary(): Promise<AuditSummary> {
    return this.queryBus.execute<GetAuditSummaryQuery, AuditSummary>(
      new GetAuditSummaryQuery(),
    );
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener un registro de auditoría por ID (solo ADMIN)' })
  @ApiParam({ name: 'id', type: String, description: 'UUID del registro de auditoría' })
  @ApiResponse({ status: 200, type: AuditLogResponseDto })
  @ApiResponse({ status: 400, description: 'ID no es un UUID válido' })
  @ApiResponse({ status: 404, description: 'Registro no encontrado' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AuditLogResponseDto> {
    const log = await this.queryBus.execute<GetAuditLogQuery, AuditLog | null>(
      new GetAuditLogQuery(id),
    );

    if (!log) {
      throw new NotFoundException(`AuditLog with ID ${id} not found`);
    }

    return AuditLogResponseDto.fromEntity(log);
  }
}
