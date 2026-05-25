import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Headers,
  Req,
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

import { QuickConfirmSaleCommand } from '../../application/cqrs/sale/commands/quick-confirm-sale/quick-confirm-sale.command';

import { CancelSaleCommand } from '../../application/cqrs/sale/commands/cancel-sale/cancel-sale.command';
import { GetSaleQuery } from '../../application/cqrs/sale/queries/get-sale/get-sale.query';
import { ListSalesQuery } from '../../application/cqrs/sale/queries/list-sales/list-sales.query';

import { ConfirmSaleRequestDto } from '../../application/dto/sale/sale-confirm-request.dto';
import { PaginationParams } from '../../domain/repositories/pagination.types';
import { SaleResponseDto } from '../../application/dto/sale/sale-response.dto';

@ApiTags('sales')
@ApiBearerAuth('access-token')
@Controller('sales')
export class SaleController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post('confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Quick confirm a sale with all details in one request (POS flow)' })
  @ApiBody({ type: ConfirmSaleRequestDto })
  @ApiResponse({ status: 200, description: 'Sale confirmed' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 409, description: 'Insufficient stock' })
  async quickConfirm(
    @Req() req: { user: { employeeId: string } },
    @Body() dto: ConfirmSaleRequestDto,
    @Headers('x-idempotency-key') idempotencyKey?: string,
  ): Promise<{ id: string; saleNumber: string; subtotal: number; taxAmount: number; total: number; status: string }> {
    return this.commandBus.execute(
      new QuickConfirmSaleCommand({
        customerId: dto.customerId || null,
        details: dto.details,
        idempotencyKey,
        cashierUserId: req.user.employeeId,
      }),
    );
  }

  @Post(':saleId/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a confirmed sale (restores stock)' })
  @ApiParam({ name: 'saleId', description: 'Sale UUID', type: String })
  @ApiResponse({ status: 200, description: 'Sale cancelled' })
  @ApiResponse({ status: 404, description: 'Sale not found' })
  async cancel(
    @Param('saleId') saleId: string,
  ): Promise<{ success: boolean; saleId: string }> {
    await this.commandBus.execute(new CancelSaleCommand(saleId));
    return { success: true, saleId };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a sale by ID' })
  @ApiParam({ name: 'id', description: 'Sale UUID', type: String })
  @ApiResponse({ status: 200, description: 'Sale found', type: SaleResponseDto })
  @ApiResponse({ status: 404, description: 'Sale not found' })
  async findOne(@Param('id') id: string): Promise<SaleResponseDto | null> {
    return this.queryBus.execute(new GetSaleQuery(id));
  }

  @Get()
  @ApiOperation({ summary: 'List sales with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'q', required: false, type: String })
  @ApiQuery({ name: 'customerId', required: false, type: String })
  @ApiResponse({ status: 200, description: 'List of sales' })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('q') searchQuery?: string,
    @Query('customerId') customerId?: string,
  ) {
    const pagination: PaginationParams = {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    };

    const result = await this.queryBus.execute(
      new ListSalesQuery(pagination, searchQuery, undefined, customerId),
    );

    return {
      data: SaleResponseDto.fromEntities(result.data),
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }
}