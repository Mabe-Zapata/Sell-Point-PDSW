import {
  IsString,
  IsEmail,
  IsNotEmpty,
  MaxLength,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { UserRole } from '../auth/register-employee.dto';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty({ message: 'Employee ID is required' })
  @MaxLength(50)
  employeeId!: string;
  @IsString()
  @IsNotEmpty({ message: 'Username is required' })
  @MaxLength(100)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  username!: string;
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  @MaxLength(255)
  email!: string;
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MaxLength(100)
  password!: string;
  @IsString()
  @IsOptional()
  @IsEnum(UserRole)
  @MaxLength(50)
  role?: UserRole | string;
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
  @IsString()
  @IsOptional()
  @MaxLength(20)
  cedula?: string;
}

