import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  MaxLength,
  IsOptional,
  Max,
  IsInt,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  code: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Max(99999999.99)
  @Type(() => Number)
  unitPrice: number;

  @IsInt()
  @IsPositive()
  @Type(() => Number)
  availableQuantity: number;
}
