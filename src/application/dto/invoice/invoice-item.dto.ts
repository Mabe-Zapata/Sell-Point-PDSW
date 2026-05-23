import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsPositive,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

export class InvoiceItemDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  unitPrice: number;

  @IsInt()
  @IsPositive()
  @Type(() => Number)
  quantity: number;
}
