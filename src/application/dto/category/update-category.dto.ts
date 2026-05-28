import { IsString, IsNotEmpty, MaxLength, IsOptional, IsBoolean, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateCategoryDto {
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @MaxLength(100)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name?: string;
  @IsString()
  @IsOptional()
  @MaxLength(255)
  description?: string;
  @IsUUID()
  @IsOptional()
  taxRateId?: string;
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
