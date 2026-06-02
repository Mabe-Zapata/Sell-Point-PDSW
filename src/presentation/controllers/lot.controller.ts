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
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateLotDto } from '../../application/dto/lot/create-lot.dto';
import { LotResponseDto } from '../../application/dto/lot/lot-response.dto';
import { UpdateLotStockDto } from '../../application/dto/lot/update-lot-stock.dto';
import { LotManagementService } from '../../infrastructure/services/lot-management.service';

@ApiTags('lots')
@ApiBearerAuth('access-token')
@Controller('lots')
export class LotController {
  constructor(private readonly lotManagementService: LotManagementService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear un lote', description: 'Registra un nuevo lote de producto con su costo y cantidad recibida.' })
  @ApiBody({ type: CreateLotDto })
  @ApiResponse({ status: 201, description: 'Lote creado exitosamente', type: LotResponseDto })
  @ApiResponse({ status: 400, description: 'Datos inválidos o producto no encontrado' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  async create(@Body() dto: CreateLotDto): Promise<LotResponseDto> {
    const lot = await this.lotManagementService.create(dto);
    return LotResponseDto.fromEntity(lot);
  }

  @Get()
  @ApiOperation({ summary: 'Listar lotes por producto', description: 'Obtiene todos los lotes activos de un producto específico.' })
  @ApiQuery({ name: 'productId', required: true, type: String, description: 'UUID del producto' })
  @ApiResponse({ status: 200, type: LotResponseDto, isArray: true })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  async findAll(@Query('productId') productId?: string): Promise<LotResponseDto[]> {
    if (!productId) {
      return [];
    }
    const lots = await this.lotManagementService.listByProduct(productId);
    return LotResponseDto.fromEntities(lots);
  }

  @Patch(':id/stock')
  @ApiOperation({ summary: 'Actualizar stock disponible de un lote', description: 'Ajusta la cantidad disponible de un lote existente.' })
  @ApiParam({ name: 'id', type: String, description: 'UUID del lote' })
  @ApiBody({ type: UpdateLotStockDto })
  @ApiResponse({ status: 200, type: LotResponseDto })
  @ApiResponse({ status: 400, description: 'Lote no encontrado o cantidad inválida' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  async updateStock(
    @Param('id') id: string,
    @Body() dto: UpdateLotStockDto,
  ): Promise<LotResponseDto> {
    const lot = await this.lotManagementService.updateStock(id, dto);
    return LotResponseDto.fromEntity(lot);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un lote', description: 'Elimina (soft delete) un lote sin stock disponible.' })
  @ApiParam({ name: 'id', type: String, description: 'UUID del lote' })
  @ApiResponse({ status: 204, description: 'Lote eliminado exitosamente' })
  @ApiResponse({ status: 400, description: 'Lote no encontrado o tiene stock disponible' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.lotManagementService.softDelete(id);
  }
}
