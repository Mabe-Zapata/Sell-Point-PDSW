import { IsBoolean, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateInvoiceSeriesDto {
  @IsOptional()
  @IsString()
  branchId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  establishmentCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  emissionPointCode?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  currentSequence?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
