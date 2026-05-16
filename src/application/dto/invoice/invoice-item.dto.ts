import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsPositive,
} from 'class-validator';
import { Type } from 'class-transformer';

export class InvoiceItemDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsInt()
  @IsPositive()
  @Type(() => Number)
  quantity: number;
}
