import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { CreateTaxRateCommand } from '../../application/cqrs/tax-rate/commands/create-tax-rate/create-tax-rate.command';
import { UpdateTaxRateCommand } from '../../application/cqrs/tax-rate/commands/update-tax-rate/update-tax-rate.command';
import { GetTaxRateQuery } from '../../application/cqrs/tax-rate/queries/get-tax-rate/get-tax-rate.query';
import { ListTaxRatesQuery } from '../../application/cqrs/tax-rate/queries/list-tax-rates/list-tax-rates.query';

import { CreateTaxRateDto } from '../../application/dto/tax-rate/create-tax-rate.dto';
import { UpdateTaxRateDto } from '../../application/dto/tax-rate/update-tax-rate.dto';
import { TaxRateResponseDto } from '../../application/dto/tax-rate/tax-rate-response.dto';
import { PaginationParams } from '../../domain/repositories/pagination.types';
import { TaxRate } from '../../domain/entities/tax-rate.entity';
import { Roles } from '../decorators/roles.decorator';

@ApiTags('tax-rates')
@ApiBearerAuth('access-token')
@Controller('tax-rates')
export class TaxRateController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new tax rate (ADMIN only)' })
  @ApiBody({ type: CreateTaxRateDto })
  @ApiResponse({ status: 201, description: 'Tax rate created', type: TaxRateResponseDto })
  @ApiResponse({ status: 409, description: 'Tax rate name already exists' })
  async create(@Body() dto: CreateTaxRateDto): Promise<TaxRateResponseDto> {
    const taxRate = await this.commandBus.execute<CreateTaxRateCommand, TaxRate>(
      new CreateTaxRateCommand(dto),
    );
    return TaxRateResponseDto.fromEntity(taxRate);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List tax rates with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'q', required: false, type: String })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'List of tax rates' })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('q') searchQuery?: string,
    @Query('isActive') isActive?: string,
  ): Promise<{
    data: TaxRateResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const pagination: PaginationParams = {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    };

    const isAct = isActive === undefined ? undefined : isActive === 'true';

    const result = await this.queryBus.execute(
      new ListTaxRatesQuery(pagination, searchQuery, isAct),
    );

    return {
      data: TaxRateResponseDto.fromEntities(result.data),
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a tax rate by ID' })
  @ApiParam({ name: 'id', description: 'Tax rate UUID', type: String })
  @ApiResponse({ status: 200, description: 'Tax rate found', type: TaxRateResponseDto })
  @ApiResponse({ status: 404, description: 'Tax rate not found' })
  async findOne(@Param('id') id: string): Promise<TaxRateResponseDto> {
    const taxRate = await this.queryBus.execute<GetTaxRateQuery, TaxRate | null>(
      new GetTaxRateQuery(id),
    );
    return TaxRateResponseDto.fromEntity(taxRate!);
  }

  @Put(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a tax rate (ADMIN only)' })
  @ApiParam({ name: 'id', description: 'Tax rate UUID', type: String })
  @ApiBody({ type: UpdateTaxRateDto })
  @ApiResponse({ status: 200, description: 'Tax rate updated', type: TaxRateResponseDto })
  @ApiResponse({ status: 404, description: 'Tax rate not found' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTaxRateDto,
  ): Promise<TaxRateResponseDto> {
    const taxRate = await this.commandBus.execute<UpdateTaxRateCommand, TaxRate>(
      new UpdateTaxRateCommand(id, dto),
    );
    return TaxRateResponseDto.fromEntity(taxRate);
  }
}
