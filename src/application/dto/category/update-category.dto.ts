import { IsString, IsNotEmpty, MaxLength, IsOptional, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCategoryDto {
  @ApiPropertyOptional({ description: 'The updated name of the category', example: 'Snacks' })
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @MaxLength(100)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name?: string;

  @ApiPropertyOptional({ description: 'The updated description of the category', example: 'Chips, cookies and chocolates' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  description?: string;

  @ApiPropertyOptional({ description: 'The status of the category', example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
