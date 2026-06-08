import { IsString, IsOptional, IsNumber, Min, Max, MaxLength, IsBoolean } from 'class-validator';

export class UpdateTaxRateDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  percentage?: number;
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
