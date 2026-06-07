import {
  Controller,
  Get,
  Param,
  Query,
  ParseIntPipe,
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
import { ListErrorLogsQuery } from '../../application/cqrs/error-log/queries/list-error-logs/list-error-logs.query';
import { GetErrorLogQuery } from '../../application/cqrs/error-log/queries/get-error-log/get-error-log.query';
import { ErrorLogResponseDto } from '../../application/dto/error-log/error-log-response.dto';
import { PaginationParams, PaginatedResult } from '../../domain/repositories/pagination.types';
import { ErrorLog } from '../../domain/entities';
import { Roles } from '../decorators/roles.decorator';
import { PaginationQueryDto } from '../dto/pagination/pagination-query.dto';

@ApiTags('error-logs')
@ApiBearerAuth('access-token')
@Roles('ADMIN')
@Controller('error-logs')
export class ErrorLogController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar registros de error (solo ADMIN)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'q', required: false, type: String })
  @ApiQuery({ name: 'exceptionType', required: false, type: String })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiResponse({ status: 200, type: ErrorLogResponseDto, isArray: true })
  async findAll(
    @Query() paginationQuery: PaginationQueryDto,
    @Query('q') q?: string,
    @Query('exceptionType') exceptionType?: string,
    @Query('userId') userId?: string,
  ): Promise<{ data: ErrorLogResponseDto[]; total: number; page: number; limit: number }> {
    const pagination: PaginationParams = {
      page: paginationQuery.page ?? 1,
      limit: paginationQuery.limit ?? 20,
    };

    const result = await this.queryBus.execute<ListErrorLogsQuery, PaginatedResult<ErrorLog>>(
      new ListErrorLogsQuery(pagination, q, exceptionType, userId),
    );

    return {
      data: result.data.map((log) => ErrorLogResponseDto.fromEntity(log)),
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener un registro de error por ID (solo ADMIN)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, type: ErrorLogResponseDto })
  @ApiResponse({ status: 404, description: 'Error no encontrado' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ErrorLogResponseDto> {
    const log = await this.queryBus.execute<GetErrorLogQuery, ErrorLog | null>(
      new GetErrorLogQuery(id),
    );

    if (!log) {
      throw new NotFoundException(`ErrorLog with ID ${id} not found`);
    }

    return ErrorLogResponseDto.fromEntity(log);
  }
}