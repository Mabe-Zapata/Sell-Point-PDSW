import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, Max, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTaxRateDto {
  @ApiProperty({ description: 'Tax rate name', example: 'IVA 15%' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ description: 'Tax percentage', example: 15 })
  @IsNumber()
  @Min(0)
  @Max(100)
  percentage: number;

  @ApiPropertyOptional({ description: 'Active status', example: true })
  @IsOptional()
  isActive?: boolean;
}
