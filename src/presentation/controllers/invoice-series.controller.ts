import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CreateInvoiceSeriesDto } from '../../application/dto/invoice-series/create-invoice-series.dto';
import { UpdateInvoiceSeriesDto } from '../../application/dto/invoice-series/update-invoice-series.dto';
import { InvoiceSeriesResponseDto } from '../../application/dto/invoice-series/invoice-series-response.dto';
import { InvoiceSeries } from '../../domain/entities';
import type { IInvoiceSeriesRepository } from '../../domain/repositories';
import { EntityNotFoundException } from '../../domain/exceptions/entity-not-found.exception';
import { INVOICE_SERIES_REPOSITORY } from '../../infrastructure/common/injection-tokens';
import { Roles } from '../decorators/roles.decorator';

@Controller('invoice-series')
export class InvoiceSeriesController {
  constructor(
    @Inject(INVOICE_SERIES_REPOSITORY)
    private readonly invoiceSeriesRepository: IInvoiceSeriesRepository,
  ) {}

  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('branchId') branchId?: string,
    @Query('isActive') isActive?: string,
  ): Promise<{ data: InvoiceSeriesResponseDto[]; total: number; page: number; limit: number }> {
    const pagination = {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    };
    const result = await this.invoiceSeriesRepository.findAll(pagination, {
      branchId,
      isActive: isActive === undefined ? undefined : isActive === 'true',
    });

    return {
      data: InvoiceSeriesResponseDto.fromEntities(result.data),
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }

  @Post()
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateInvoiceSeriesDto): Promise<InvoiceSeriesResponseDto> {
    const created = await this.invoiceSeriesRepository.create(
      new InvoiceSeries({
        id: randomUUID(),
        branchId: dto.branchId,
        establishmentCode: dto.establishmentCode,
        emissionPointCode: dto.emissionPointCode,
        currentSequence: dto.currentSequence ?? 0,
        isActive: false,
      }),
    );

    if (dto.isActive ?? true) {
      return InvoiceSeriesResponseDto.fromEntity(
        await this.invoiceSeriesRepository.activateExclusiveForBranch(created.id),
      );
    }

    return InvoiceSeriesResponseDto.fromEntity(created);
  }

  @Put(':id')
  @Roles('ADMIN')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateInvoiceSeriesDto,
  ): Promise<InvoiceSeriesResponseDto> {
    const existing = await this.invoiceSeriesRepository.findById(id);
    if (!existing) {
      throw new EntityNotFoundException('InvoiceSeries', id);
    }

    const shouldActivate = dto.isActive ?? existing.isActive;
    const updated = await this.invoiceSeriesRepository.update(
      new InvoiceSeries({
        ...existing,
        branchId: dto.branchId ?? existing.branchId,
        establishmentCode: dto.establishmentCode ?? existing.establishmentCode,
        emissionPointCode: dto.emissionPointCode ?? existing.emissionPointCode,
        currentSequence: dto.currentSequence ?? existing.currentSequence,
        isActive: false,
      }),
    );

    if (shouldActivate) {
      return InvoiceSeriesResponseDto.fromEntity(
        await this.invoiceSeriesRepository.activateExclusiveForBranch(updated.id),
      );
    }

    return InvoiceSeriesResponseDto.fromEntity(updated);
  }

  @Patch(':id/activate')
  @Roles('ADMIN')
  async activate(@Param('id') id: string): Promise<InvoiceSeriesResponseDto> {
    const existing = await this.invoiceSeriesRepository.findById(id);
    if (!existing) {
      throw new EntityNotFoundException('InvoiceSeries', id);
    }

    const activated = await this.invoiceSeriesRepository.activateExclusiveForBranch(existing.id);
    return InvoiceSeriesResponseDto.fromEntity(activated);
  }

  @Patch(':id/deactivate')
  @Roles('ADMIN')
  async deactivate(@Param('id') id: string): Promise<InvoiceSeriesResponseDto> {
    const existing = await this.invoiceSeriesRepository.findById(id);
    if (!existing) {
      throw new EntityNotFoundException('InvoiceSeries', id);
    }

    const deactivated = await this.invoiceSeriesRepository.update(
      new InvoiceSeries({ ...existing, isActive: false }),
    );
    return InvoiceSeriesResponseDto.fromEntity(deactivated);
  }
}
