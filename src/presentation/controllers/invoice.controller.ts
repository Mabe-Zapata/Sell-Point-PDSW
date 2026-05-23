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
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiProduces,
} from '@nestjs/swagger';
import type { Response } from 'express';

import { CreateInvoiceCommand } from '../../application/cqrs/invoice/commands/create-invoice/create-invoice.command';
import { GetInvoiceQuery } from '../../application/cqrs/invoice/queries/get-invoice/get-invoice.query';
import { ListInvoicesWithStockQuery } from '../../application/cqrs/invoice/queries/list-invoices-with-stock/list-invoices-with-stock.query';
import { GenerateInvoicePdfQuery } from '../../application/cqrs/invoice/queries/generate-invoice-pdf/generate-invoice-pdf.query';

import { CreateInvoiceDto } from '../../application/dto/invoice/create-invoice.dto';
import { InvoiceResponseDto } from '../../application/dto/invoice/invoice-response.dto';
import { InvoiceListResponseDto } from '../../application/dto/invoice/invoice-list-response.dto';
import { PaginationParams } from '../../domain/repositories/pagination.types';

@ApiTags('invoices')
@Controller('invoices')
export class InvoiceController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
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
  async create(
    @Body() createInvoiceDto: CreateInvoiceDto,
  ): Promise<InvoiceResponseDto> {
    const invoice = await this.commandBus.execute(
      new CreateInvoiceCommand(createInvoiceDto),
    );
    return InvoiceResponseDto.fromEntity(invoice);
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
    const invoice = await this.queryBus.execute(new GetInvoiceQuery(id));
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
    const pdfBuffer = await this.queryBus.execute(
      new GenerateInvoicePdfQuery(id),
    );

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
      new ListInvoicesWithStockQuery(
        pagination,
        branchId,
        status,
        invoiceNumber,
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined,
      ),
    );

    return {
      data: InvoiceListResponseDto.fromQueryResults(result.data),
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }
}