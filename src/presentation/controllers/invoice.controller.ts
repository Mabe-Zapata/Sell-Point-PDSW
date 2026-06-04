import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiProduces,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import type { Response } from 'express';
import { Inject } from '@nestjs/common';

import { CreateInvoiceDto } from '../../application/dto/invoice/create-invoice.dto';
import { InvoiceResponseDto } from '../../application/dto/invoice/invoice-response.dto';
import { InvoiceListResponseDto } from '../../application/dto/invoice/invoice-list-response.dto';
import { InvoiceItemResponseDto } from '../../application/dto/invoice/invoice-item.dto';
import { Invoice, InvoiceStatus } from '../../domain/entities';

import { INVOICE_QUERY_SERVICE } from '../../application/query-tokens';
import { PDF_SERVICE } from '../../application/services/pdf-service.interface';
import { EMAIL_SERVICE } from '../../application/ports/email-service.token';
import type { IInvoiceQueryService } from '../../domain/query-services/invoice.query-service.interface';
import type { IPdfService } from '../../application/services/pdf-service.interface';
import type { IEmailService } from '../../application/ports/IEmailService';
import { PaginationParams } from '../../domain/repositories/pagination.types';
import { INVOICE_ITEM_REPOSITORY } from '../../infrastructure/common/injection-tokens';
import type { IInvoiceItemRepository } from '../../domain/repositories';
import { BusinessRuleException } from '../../domain/exceptions';
import { EntityNotFoundException } from '../../domain/exceptions/entity-not-found.exception';

import { CreateInvoiceCommand } from '../../application/cqrs/invoice/commands/create-invoice/create-invoice.command';
import { CancelInvoiceCommand } from '../../application/cqrs/invoice/commands/cancel-invoice/cancel-invoice.command';
import { GetInvoiceQuery } from '../../application/cqrs/invoice/queries/get-invoice/get-invoice.query';
import { ListInvoicesQuery } from '../../application/cqrs/invoice/queries/list-invoices/list-invoices.query';

@ApiTags('invoices')
@ApiBearerAuth('access-token')
@Controller('invoices')
export class InvoiceController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    @Inject(INVOICE_QUERY_SERVICE) private readonly invoiceQueryService: IInvoiceQueryService,
    @Inject(PDF_SERVICE) private readonly pdfService: IPdfService,
    @Inject(INVOICE_ITEM_REPOSITORY) private readonly invoiceItemRepository: IInvoiceItemRepository,
    @Inject(EMAIL_SERVICE) private readonly emailService: IEmailService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new invoice',
    description: 'Generates a new invoice for a sale using persisted sale detail snapshots.',
  })
  @ApiBody({ type: CreateInvoiceDto })
  @ApiResponse({
    status: 201,
    description: 'Invoice created successfully',
    type: InvoiceResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 404, description: 'Sale or Product not found' })
  @ApiResponse({
    status: 422,
    description: 'Insufficient stock or transaction error',
  })
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createInvoiceDto: CreateInvoiceDto): Promise<InvoiceResponseDto> {
    const result = await this.commandBus.execute(
      new CreateInvoiceCommand(
        createInvoiceDto.saleId,
        createInvoiceDto.branchId,
      ),
    );

    const invoiceData = await this.queryBus.execute(new GetInvoiceQuery(result.id));
    const items = await this.invoiceItemRepository.findByInvoiceId(result.id);

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
        customerCedula: invoiceData.customerCedula,
      }),
      InvoiceItemResponseDto.fromEntities(items),
    );
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancel(@Param('id') id: string): Promise<{ success: boolean; invoiceId: string }> {
    await this.commandBus.execute(new CancelInvoiceCommand(id));
    return { success: true, invoiceId: id };
  }

  @Post(':id/resend-email')
  @HttpCode(HttpStatus.OK)
  async resendEmail(
    @Param('id') id: string,
    @Body() body?: { email?: string },
  ): Promise<{ success: boolean; invoiceId: string; email: string }> {
    const invoiceData = await this.invoiceQueryService.getInvoiceById(id);
    if (!invoiceData) {
      throw new EntityNotFoundException('Invoice', id);
    }

    const email = body?.email ?? invoiceData.customerEmail;
    if (!email) {
      throw new BusinessRuleException('Invoice customer has no email. Provide an email to resend.');
    }

    const items = await this.invoiceItemRepository.findByInvoiceId(id);
    const invoice = new Invoice({
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
      customerCedula: invoiceData.customerCedula,
      establishmentCode: invoiceData.establishmentCode,
      emissionPointCode: invoiceData.emissionPointCode,
      // Audit snapshots (if available)
      customerNameSnapshot: invoiceData.customerNameSnapshot,
      customerCedulaSnapshot: invoiceData.customerCedulaSnapshot,
      customerEmailSnapshot: invoiceData.customerEmailSnapshot,
      cashierNameSnapshot: invoiceData.cashierNameSnapshot,
      cashierUsernameSnapshot: invoiceData.cashierUsernameSnapshot,
      cashierEmployeeIdSnapshot: invoiceData.cashierEmployeeIdSnapshot,
    });
    const pdfBuffer = await this.pdfService.generateInvoicePdf(invoice, items);
    const result = await this.emailService.sendInvoice(email, id, {
      invoiceNumber: invoiceData.invoiceNumber,
      date: invoiceData.issueDate.toLocaleDateString('es-EC'),
      customerName: invoiceData.customerName || 'Consumidor Final',
      customerCedula: invoiceData.customerCedula || undefined,
      subtotal: invoiceData.subtotal,
      iva: invoiceData.iva,
      items: items.map((item) => ({
        description: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
        taxPercentage: item.taxPercentage,
        taxAmount: item.taxAmount,
        total: item.total,
      })),
      total: invoiceData.total,
      includeTaxBreakdown: true,
      attachments: [
        {
          filename: `factura-${invoiceData.invoiceNumber}.pdf`,
          content: pdfBuffer,
          mimetype: 'application/pdf',
        },
      ],
    });

    if (!result.success) {
      throw new BusinessRuleException(result.error ?? 'Invoice email could not be sent');
    }

    return { success: true, invoiceId: id, email };
  }

  @Get('kpis')
  async getKpis(@Query('branchId') branchId?: string) {
    return this.invoiceQueryService.getInvoiceKpis({ branchId });
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get an invoice by ID',
    description: 'Retrieves an invoice by their unique identifier',
  })
  @ApiParam({ name: 'id', description: 'Invoice UUID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Invoice found',
    type: InvoiceResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async findOne(@Param('id') id: string): Promise<InvoiceResponseDto> {
    const invoiceData = await this.queryBus.execute(new GetInvoiceQuery(id));

    const invoice = new Invoice({
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
      customerCedula: invoiceData.customerCedula,
      establishmentCode: invoiceData.establishmentCode,
      emissionPointCode: invoiceData.emissionPointCode,
      // Audit snapshots (if available)
      customerNameSnapshot: invoiceData.customerNameSnapshot,
      customerCedulaSnapshot: invoiceData.customerCedulaSnapshot,
      customerEmailSnapshot: invoiceData.customerEmailSnapshot,
      cashierNameSnapshot: invoiceData.cashierNameSnapshot,
      cashierUsernameSnapshot: invoiceData.cashierUsernameSnapshot,
      cashierEmployeeIdSnapshot: invoiceData.cashierEmployeeIdSnapshot,
    });

    // Fetch items
    const items = await this.invoiceItemRepository.findByInvoiceId(id);

    return InvoiceResponseDto.fromEntity(
      invoice,
      InvoiceItemResponseDto.fromEntities(items),
    );
  }

  @Get(':id/pdf')
  @ApiOperation({
    summary: 'Generate PDF for an invoice',
    description: 'Generates a PDF document for the specified invoice',
  })
  @ApiParam({ name: 'id', description: 'Invoice UUID', type: String })
  @ApiProduces('application/pdf')
  @ApiResponse({
    status: 200,
    description: 'PDF generated successfully',
    schema: { type: 'file' },
  })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async getPdf(@Param('id') id: string, @Res() res: Response): Promise<void> {
    const invoiceData = await this.invoiceQueryService.getInvoiceById(id);
    if (!invoiceData) {
      res.status(404).send('Invoice not found');
      return;
    }

    const invoice = new Invoice({
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
      customerId: invoiceData.customerCedula,
      customerCedula: invoiceData.customerCedula,
      establishmentCode: invoiceData.establishmentCode,
      emissionPointCode: invoiceData.emissionPointCode,
      invoiceDate: invoiceData.issueDate,
      // Audit snapshots (if available) — PDF service uses these for historical accuracy
      customerNameSnapshot: invoiceData.customerNameSnapshot,
      customerCedulaSnapshot: invoiceData.customerCedulaSnapshot,
      customerEmailSnapshot: invoiceData.customerEmailSnapshot,
      cashierNameSnapshot: invoiceData.cashierNameSnapshot,
      cashierUsernameSnapshot: invoiceData.cashierUsernameSnapshot,
      cashierEmployeeIdSnapshot: invoiceData.cashierEmployeeIdSnapshot,
    });

    const items = await this.invoiceItemRepository.findByInvoiceId(id);
    const pdfBuffer = await this.pdfService.generateInvoicePdf(invoice, items);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="factura-${id}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    res.end(pdfBuffer);
  }

  @Get()
  @ApiOperation({
    summary: 'List invoices (pg query service)',
    description: 'Retrieves a paginated list of invoices using pg raw SQL for optimal read performance.',
  })
  @ApiQuery({ name: 'page', description: 'Page number (default: 1)', required: false, type: Number })
  @ApiQuery({ name: 'limit', description: 'Number of items per page (default: 20)', required: false, type: Number })
  @ApiQuery({ name: 'branchId', description: 'Filter by branch ID', required: false, type: String })
  @ApiQuery({ name: 'status', description: 'Filter by status', required: false, type: String })
  @ApiQuery({ name: 'invoiceNumber', description: 'Filter by invoice number', required: false, type: String })
  @ApiQuery({ name: 'startDate', description: 'Filter by start date', required: false, type: String })
  @ApiQuery({ name: 'endDate', description: 'Filter by end date', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'List of invoices retrieved successfully',
  })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('branchId') branchId?: string,
    @Query('status') status?: string,
    @Query('invoiceNumber') invoiceNumber?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<{
    data: InvoiceListResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const pagination: PaginationParams = {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    };

    const result = await this.queryBus.execute(
      new ListInvoicesQuery(pagination, {
        branchId,
        status,
        invoiceNumber,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      }),
    );

    return {
      data: InvoiceListResponseDto.fromQueryResults(result.data),
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }
}
