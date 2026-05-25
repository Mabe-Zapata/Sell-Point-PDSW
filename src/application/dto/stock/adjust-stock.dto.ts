import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { StockMovementType } from '../../../domain/entities/enums/stock-movement-type.enum';

export class AdjustStockDto {
  @IsEnum(StockMovementType)
  @IsNotEmpty()
  type: StockMovementType;

  @IsNumber({ allowInfinity: false, allowNaN: false })
  @IsNotEmpty()
  quantity: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  referenceType?: string;

  @IsString()
  @IsOptional()
  referenceId?: string;
}
