import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CreateLotDto } from '../../application/dto/lot/create-lot.dto';
import { LotResponseDto } from '../../application/dto/lot/lot-response.dto';
import { UpdateLotStockDto } from '../../application/dto/lot/update-lot-stock.dto';
import { LotManagementService } from '../../infrastructure/services/lot-management.service';

@Controller('lots')
export class LotController {
  constructor(private readonly lotManagementService: LotManagementService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateLotDto): Promise<LotResponseDto> {
    const lot = await this.lotManagementService.create(dto);
    return LotResponseDto.fromEntity(lot);
  }

  @Get()
  async findAll(@Query('productId') productId?: string): Promise<LotResponseDto[]> {
    if (!productId) {
      return [];
    }
    const lots = await this.lotManagementService.listByProduct(productId);
    return LotResponseDto.fromEntities(lots);
  }

  @Patch(':id/stock')
  async updateStock(
    @Param('id') id: string,
    @Body() dto: UpdateLotStockDto,
  ): Promise<LotResponseDto> {
    const lot = await this.lotManagementService.updateStock(id, dto);
    return LotResponseDto.fromEntity(lot);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.lotManagementService.softDelete(id);
  }
}
