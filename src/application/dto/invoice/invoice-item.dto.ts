import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsPositive,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';

export class InvoiceItemDto {
  @IsUUID()
  productId: string;

  @IsInt()
  @IsPositive()
  @Type(() => Number)
  quantity: number;
}
