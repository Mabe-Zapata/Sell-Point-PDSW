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
import { ListInvoicesQuery } from '../../application/cqrs/invoice/queries/list-invoices/list-invoices.query';
import { GenerateInvoicePdfQuery } from '../../application/cqrs/invoice/queries/generate-invoice-pdf/generate-invoice-pdf.query';

import { CreateInvoiceDto } from '../../application/dto/invoice/create-invoice.dto';
import { InvoiceResponseDto } from '../../application/dto/invoice/invoice-response.dto';
import { InvoiceFilters } from '../../domain/repositories/invoice.repository.interface';
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
    description:
      'Generates a new invoice, automatically calculates totals (subtotal, IVA, total), and atomically decrements product stock. Rolls back transaction if stock is insufficient.',
  })
  @ApiBody({ type: CreateInvoiceDto })
  @ApiResponse({
    status: 201,
    description: 'Invoice created successfully',
    type: InvoiceResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 404, description: 'Customer or Product not found' })
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
    summary: 'List invoices with pagination and filters',
    description: 'Retrieves a paginated list of invoices. Allows generic search by exact invoice ID and partial match on customer name or last name.',
  })
  @ApiQuery({
    name: 'page',
    description: 'Page number (default: 1)',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Number of items per page (default: 20)',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'id',
    description: 'Filter by invoice ID',
    required: false,
    type: String,
  })
  @ApiQuery({
    name: 'cliente',
    description: 'Filter by customer name or lastName',
    required: false,
    type: String,
  })
  @ApiQuery({
    name: 'num_fac',
    description: 'Filter by invoice number (partial LIKE match)',
    required: false,
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'List of invoices retrieved successfully',
  })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('id') id?: string,
    @Query('cliente') customer?: string,
    @Query('num_fac') invoiceNumber?: string,
  ): Promise<{
    data: InvoiceResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const pagination: PaginationParams = {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    };

    const filters: InvoiceFilters = {
      id,
      customer,
      invoiceNumber,
    };

    const result = await this.queryBus.execute(
      new ListInvoicesQuery(pagination, filters),
    );

    return {
      data: InvoiceResponseDto.fromEntities(result.data),
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }
}
