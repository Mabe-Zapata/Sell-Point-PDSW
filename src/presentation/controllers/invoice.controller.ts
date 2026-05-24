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
import type { Response } from 'express';
import { Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { CreateInvoiceDto } from '../../application/dto/invoice/create-invoice.dto';
import { InvoiceResponseDto } from '../../application/dto/invoice/invoice-response.dto';
import { InvoiceListResponseDto } from '../../application/dto/invoice/invoice-list-response.dto';
import type { PaginationParams, IInvoiceRepository, IInvoiceItemRepository } from '../../domain/repositories';

import { INVOICE_QUERY_SERVICE } from '../../application/query-tokens';
import { PDF_SERVICE } from '../../application/services/pdf-service.interface';
import { INVOICE_REPOSITORY, INVOICE_ITEM_REPOSITORY } from '../../application/tokens';
import type { IInvoiceQueryService } from '../../domain/query-services/invoice.query-service.interface';
import type { IPdfService } from '../../application/services/pdf-service.interface';
import { Invoice, InvoiceItem } from '../../domain/entities';

@ApiTags('invoices')
@ApiBearerAuth('access-token')
@Controller('invoices')
export class InvoiceController {
  constructor(
    @Inject(INVOICE_QUERY_SERVICE) private readonly invoiceQueryService: IInvoiceQueryService,
    @Inject(INVOICE_REPOSITORY) private readonly invoiceRepository: IInvoiceRepository,
    @Inject(INVOICE_ITEM_REPOSITORY) private readonly invoiceItemRepository: IInvoiceItemRepository,
    @Inject(PDF_SERVICE) private readonly pdfService: IPdfService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new invoice',
    description: 'Generates a new invoice for a sale and persists its item lines.',
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
    // Build Invoice domain entity from DTO
    const invoice = new Invoice({
      saleId: createInvoiceDto.saleId,
      seriesId: createInvoiceDto.seriesId,
      invoiceNumber: `INV-${Date.now()}`,
      issueDate: new Date(),
      status: 'PROCESSED' as any,
    });

    // Persist invoice
    const savedInvoice = await this.invoiceRepository.create(invoice);

    // Persist items
    const items = createInvoiceDto.items.map(
      (itemDto) =>
        new InvoiceItem({
          invoiceId: savedInvoice.id,
          productId: itemDto.productId,
          quantity: itemDto.quantity,
          unitPrice: itemDto.unitPrice,
        }),
    );
    await this.invoiceItemRepository.createMany(items);

    return InvoiceResponseDto.fromEntity(savedInvoice);
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
    // Use query service to get full invoice data with customer info for response
    const invoiceData = await this.invoiceQueryService.getInvoiceById(id);
    if (!invoiceData) {
      throw new Error('Invoice not found');
    }

    // Build Invoice domain entity for PDF
    const invoice = new Invoice({
      id: invoiceData.id,
      saleId: invoiceData.saleId,
      seriesId: invoiceData.seriesId,
      invoiceNumber: invoiceData.invoiceNumber,
      authorizationNumber: invoiceData.authorizationNumber ?? undefined,
      issueDate: invoiceData.issueDate,
      status: invoiceData.status as any,
      cancelledAt: invoiceData.cancelledAt ?? undefined,
      createdAt: invoiceData.createdAt,
      total: invoiceData.total,
      subtotal: invoiceData.total / 1.15,
      iva: invoiceData.total - invoiceData.total / 1.15,
      invoiceDate: invoiceData.issueDate,
    });

    return InvoiceResponseDto.fromEntity(invoice);
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
    // Fetch invoice data with customer and sale info
    const invoiceData = await this.invoiceQueryService.getInvoiceById(id);
    if (!invoiceData) {
      res.status(404).send('Invoice not found');
      return;
    }

    // Build Invoice domain entity for response DTO
    const invoice = new Invoice({
      id: invoiceData.id,
      saleId: invoiceData.saleId,
      seriesId: invoiceData.seriesId,
      invoiceNumber: invoiceData.invoiceNumber,
      authorizationNumber: invoiceData.authorizationNumber ?? undefined,
      issueDate: invoiceData.issueDate,
      status: invoiceData.status as any,
      cancelledAt: invoiceData.cancelledAt ?? undefined,
      createdAt: invoiceData.createdAt,
      total: invoiceData.total,
      subtotal: invoiceData.total / 1.15,
      iva: invoiceData.total - invoiceData.total / 1.15,
      invoiceDate: invoiceData.issueDate,
    });

    // Fetch invoice items
    const items = await this.invoiceItemRepository.findByInvoiceId(id);

    // Generate PDF
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

    const result = await this.invoiceQueryService.listInvoices({
      page: pagination.page,
      limit: pagination.limit,
      branchId,
      status,
      invoiceNumber,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });

    return {
      data: InvoiceListResponseDto.fromQueryResults(result.data),
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }
}
