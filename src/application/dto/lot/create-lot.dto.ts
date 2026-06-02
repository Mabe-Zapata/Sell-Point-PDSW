import { IsString, IsNotEmpty, IsNumber, IsPositive, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLotDto {
  @ApiProperty({ description: 'UUID del producto', example: '9cb61f6a-24e9-411e-95e3-8f45d5093ab9' })
  @IsString()
  @IsNotEmpty()
  productId!: string;

  @ApiProperty({ description: 'Código único del lote', example: 'LOTE-2025-001' })
  @IsString()
  @IsNotEmpty()
  lotCode!: string;

  @ApiProperty({ description: 'Cantidad recibida en el lote', example: 100 })
  @IsNumber()
  @IsPositive()
  quantityReceived!: number;

  @ApiProperty({ description: 'Costo unitario del producto en este lote', example: 15.50 })
  @IsNumber()
  @IsPositive()
  unitCost!: number;

  @ApiProperty({ description: 'Fecha de recepción (ISO 8601)', example: '2025-06-01T00:00:00.000Z' })
  @IsDateString()
  @IsNotEmpty()
  receivedAt!: string;

  @ApiPropertyOptional({ description: 'Fecha de vencimiento (ISO 8601)', example: '2026-06-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
