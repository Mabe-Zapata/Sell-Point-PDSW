import { IsString, IsOptional, IsNumber, Min, Max, MaxLength, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTaxRateDto {
  @ApiPropertyOptional({ description: 'Tax rate name', example: 'IVA 15%' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ description: 'Tax percentage', example: 15 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  percentage?: number;

  @ApiPropertyOptional({ description: 'Active status', example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
