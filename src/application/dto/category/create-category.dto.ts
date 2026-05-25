import { IsString, IsNotEmpty, MaxLength, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ description: 'The name of the category', example: 'Beverages' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name: string;

  @ApiPropertyOptional({ description: 'Detailed description of the category', example: 'Drinks, soda, water and juices' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  description?: string;
}
