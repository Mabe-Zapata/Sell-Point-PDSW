import { IsArray, IsNotEmpty, IsOptional, IsString, IsNumber, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ConfirmSaleDetailDto {
  @IsString()
  @IsNotEmpty()
  productId: string;
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class ConfirmSaleRequestDto {
  @IsString()
  @IsOptional()
  customerId?: string;
  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ConfirmSaleDetailDto)
  details: ConfirmSaleDetailDto[];
}

