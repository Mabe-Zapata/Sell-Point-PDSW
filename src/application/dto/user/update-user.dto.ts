import {
  IsString,
  IsEmail,
  MaxLength,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { UserRole } from '../auth/register-employee.dto';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  firstName?: string;
  @IsString()
  @IsOptional()
  @MaxLength(100)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  lastName?: string;
  @IsEmail({}, { message: 'Invalid email format' })
  @IsOptional()
  @MaxLength(255)
  email?: string;
  @IsString()
  @IsOptional()
  @IsEnum(UserRole)
  @MaxLength(50)
  role?: UserRole | string;
  @IsString()
  @IsOptional()
  @MaxLength(20)
  cedula?: string;
}

