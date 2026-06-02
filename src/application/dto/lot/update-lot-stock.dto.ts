import { IsNumber, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateLotStockDto {
  @ApiProperty({ description: 'Nueva cantidad disponible en el lote', example: 85 })
  @IsNumber()
  @IsPositive()
  quantityAvailable!: number;
}
