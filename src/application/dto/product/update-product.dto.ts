import {
  IsString,
  IsNumber,
  IsPositive,
  MaxLength,
  IsOptional,
  Max,
  IsInt,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class UpdateProductDto {
  @IsString()
  @IsOptional()
  @MaxLength(50)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  code?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  @IsPositive()
  @Max(99999999.99)
  @Type(() => Number)
  unitPrice?: number;

  @IsInt()
  @IsOptional()
  @IsPositive()
  @Type(() => Number)
  availableQuantity?: number;
}
