import { IsString, IsEmail, MaxLength, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateCustomerDto {
  @IsString()
  @IsOptional()
  @MaxLength(20)
  cedula?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  names?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  lastName?: string;

  @IsEmail({}, { message: 'Invalid email format' })
  @IsOptional()
  @MaxLength(255)
  email?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  address?: string;

  @IsOptional()
  isActive?: boolean;
}