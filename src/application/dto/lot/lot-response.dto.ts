import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Lot } from '../../../domain/entities';

export class LotResponseDto {
  @ApiProperty({ description: 'UUID del lote', example: 'a1b2c3d4-...' })
  id!: string;

  @ApiProperty({ description: 'UUID del producto asociado', example: '9cb61f6a-24e9-411e-95e3-8f45d5093ab9' })
  productId!: string;

  @ApiProperty({ description: 'Código único del lote', example: 'LOTE-2025-001' })
  lotCode!: string;

  @ApiProperty({ description: 'Cantidad total recibida', example: 100 })
  quantityReceived!: number;

  @ApiProperty({ description: 'Cantidad disponible actual', example: 85 })
  quantityAvailable!: number;

  @ApiProperty({ description: 'Costo unitario', example: 15.50 })
  unitCost!: number;

  @ApiProperty({ description: 'Ganancia estimada por unidad (precioVenta - costo)', example: 34.50 })
  estimatedUnitProfit!: number;

  @ApiProperty({ description: 'Fecha de recepción', example: '2025-06-01T00:00:00.000Z' })
  receivedAt!: Date;

  @ApiPropertyOptional({ description: 'Fecha de vencimiento', example: '2026-06-01T00:00:00.000Z' })
  expiresAt?: Date;

  @ApiProperty({ description: 'Fecha de creación del registro', example: '2025-06-01T00:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ description: 'Fecha de última actualización', example: '2025-06-02T00:00:00.000Z' })
  updatedAt!: Date;

  static fromEntity(lot: Lot): LotResponseDto {
    return {
      id: lot.id,
      productId: lot.productId,
      lotCode: lot.lotCode,
      quantityReceived: lot.quantityReceived,
      quantityAvailable: lot.quantityAvailable,
      unitCost: lot.unitCost,
      estimatedUnitProfit: lot.estimatedUnitProfit,
      receivedAt: lot.receivedAt,
      expiresAt: lot.expiresAt,
      createdAt: lot.createdAt,
      updatedAt: lot.updatedAt,
    };
  }

  static fromEntities(lots: Lot[]): LotResponseDto[] {
    return lots.map((lot) => LotResponseDto.fromEntity(lot));
  }
}
