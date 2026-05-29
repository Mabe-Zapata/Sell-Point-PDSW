import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateInvoiceSeriesDto {
  @IsString()
  @IsNotEmpty()
  branchId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  establishmentCode: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  emissionPointCode: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  currentSequence?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
