import { IsString, IsNotEmpty, MaxLength, IsOptional, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name: string;
  @IsString()
  @IsOptional()
  @MaxLength(255)
  description?: string;
  @IsUUID()
  @IsNotEmpty()
  taxRateId: string;
}
