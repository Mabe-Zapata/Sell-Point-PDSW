import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Headers,
  Req,
  Inject,
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
import { InvoiceResponseDto } from '../../application/dto/invoice/invoice-response.dto';
import { InvoiceItemResponseDto } from '../../application/dto/invoice/invoice-item.dto';
import { Invoice, InvoiceStatus } from '../../domain/entities';
import { INVOICE_QUERY_SERVICE } from '../../application/query-tokens';
import type { IInvoiceQueryService, InvoiceListItem } from '../../domain/query-services/invoice.query-service.interface';
import { CUSTOMER_REPOSITORY, INVOICE_ITEM_REPOSITORY, USER_REPOSITORY } from '../../infrastructure/common/injection-tokens';
import type { IInvoiceItemRepository, ICustomerRepository, IUserRepository } from '../../domain/repositories';
import { CreateInvoiceCommand } from '../../application/cqrs/invoice/commands/create-invoice/create-invoice.command';
import { EntityNotFoundException } from '../../domain/exceptions/entity-not-found.exception';
import type { QuickConfirmSaleResult } from '../../application/use-cases/sale/quick-confirm-sale.use-case';

@ApiTags('sales')
@ApiBearerAuth('access-token')
@Controller('sales')
export class SaleController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    @Inject(INVOICE_QUERY_SERVICE) private readonly invoiceQueryService: IInvoiceQueryService,
    @Inject(INVOICE_ITEM_REPOSITORY) private readonly invoiceItemRepository: IInvoiceItemRepository,
    @Inject(CUSTOMER_REPOSITORY) private readonly customerRepository: ICustomerRepository,
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
  ) {}

  private async toInvoiceResponse(invoiceData: InvoiceListItem): Promise<InvoiceResponseDto> {
    const items = await this.invoiceItemRepository.findByInvoiceId(invoiceData.id);
    return InvoiceResponseDto.fromEntity(
      new Invoice({
        id: invoiceData.id,
        saleId: invoiceData.saleId,
        seriesId: invoiceData.seriesId,
        invoiceNumber: invoiceData.invoiceNumber,
        authorizationNumber: invoiceData.authorizationNumber ?? undefined,
        issueDate: invoiceData.issueDate,
        status: invoiceData.status as InvoiceStatus,
        cancelledAt: invoiceData.cancelledAt ?? undefined,
        createdAt: invoiceData.createdAt,
        subtotal: invoiceData.subtotal,
        iva: invoiceData.iva,
        total: invoiceData.total,
        saleNumber: invoiceData.saleNumber,
        customerName: invoiceData.customerName,
        customerId: invoiceData.customerId,
        customerCedula: invoiceData.customerCedula,
cashierUserId: invoiceData.cashierUserId,
        establishmentCode: invoiceData.establishmentCode,
        emissionPointCode: invoiceData.emissionPointCode,
        // Audit snapshots (if available)
        cashierNameSnapshot: invoiceData.cashierNameSnapshot,
        cashierUsernameSnapshot: invoiceData.cashierUsernameSnapshot,
        cashierEmployeeIdSnapshot: invoiceData.cashierEmployeeIdSnapshot,
      }),
      InvoiceItemResponseDto.fromEntities(items),
    );
  }

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
  ): Promise<QuickConfirmSaleResult> {
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

  @Get(':saleId/invoice')
  async findInvoiceBySale(@Param('saleId') saleId: string): Promise<InvoiceResponseDto> {
    const invoiceData = await this.invoiceQueryService.getInvoiceBySaleId(saleId);
    if (!invoiceData) {
      throw new EntityNotFoundException('Invoice', `sale ${saleId}`);
    }

    return this.toInvoiceResponse(invoiceData);
  }

  @Post(':saleId/invoice/retry')
  @HttpCode(HttpStatus.OK)
  async retryInvoiceForSale(@Param('saleId') saleId: string): Promise<InvoiceResponseDto> {
    const existingInvoice = await this.invoiceQueryService.getInvoiceBySaleId(saleId);
    if (existingInvoice) {
      return this.toInvoiceResponse(existingInvoice);
    }

    const sale = await this.queryBus.execute(new GetSaleQuery(saleId));
    if (!sale) {
      throw new EntityNotFoundException('Sale', saleId);
    }

    const customer = sale.customerId
      ? await this.customerRepository.findById(sale.customerId)
      : null;
    const customerName = customer
      ? [customer.firstName, customer.lastName].filter(Boolean).join(' ')
      : 'Consumidor Final';

    // Look up cashier for audit snapshot
    const cashier = await this.userRepository.findById(sale.cashierUserId);
    const cashierName = cashier && cashier.firstName && cashier.lastName
      ? `${cashier.firstName} ${cashier.lastName}`.trim()
      : cashier?.username ?? 'Cajero';
    const cashierUsername = cashier?.username;
    const cashierEmployeeId = cashier?.employeeId;

    const created = await this.commandBus.execute(
      new CreateInvoiceCommand(
        saleId,
        sale.branchId,
        customer?.email,
        customerName,
        customer?.cedula,
        cashierName,
        cashierUsername,
        cashierEmployeeId,
      ),
    );

    const invoiceData = await this.invoiceQueryService.getInvoiceById(created.id);
    if (!invoiceData) {
      throw new EntityNotFoundException('Invoice', created.id);
    }

    return this.toInvoiceResponse(invoiceData);
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
  @ApiQuery({ name: 'status', required: false, type: String, description: 'Filter by sale status (DRAFT, CONFIRMED, CANCELLED)' })
  @ApiQuery({ name: 'createdFrom', description: 'Filter by creation date from (ISO 8601)', required: false, type: String })
  @ApiQuery({ name: 'createdTo', description: 'Filter by creation date to (ISO 8601)', required: false, type: String })
  @ApiResponse({ status: 200, description: 'List of sales' })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('q') searchQuery?: string,
    @Query('customerId') customerId?: string,
    @Query('status') status?: string,
    @Query('createdFrom') createdFrom?: string,
    @Query('createdTo') createdTo?: string,
  ) {
    const pagination: PaginationParams = {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    };

    const result = await this.queryBus.execute(
      new ListSalesQuery(
        pagination,
        searchQuery,
        undefined,
        customerId,
        undefined,
        status,
        createdFrom ? new Date(createdFrom) : undefined,
        createdTo ? new Date(createdTo) : undefined,
      ),
    );

    return {
      data: SaleResponseDto.fromEntities(result.data),
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }
}
