import { ApiProperty } from '@nestjs/swagger';
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
  @ApiProperty({ description: 'Employee ID', example: 'EMP-002' })
  @IsString()
  @IsNotEmpty({ message: 'Employee ID is required' })
  @MaxLength(50)
  employeeId!: string;

  @ApiProperty({ description: 'Username', example: 'jsmith' })
  @IsString()
  @IsNotEmpty({ message: 'Username is required' })
  @MaxLength(100)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  username!: string;

  @ApiProperty({ description: 'Email address', example: 'jsmith@billflow.com' })
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  @MaxLength(255)
  email!: string;

  @ApiProperty({ description: 'Password', example: 'Admin1234!' })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MaxLength(100)
  password!: string;

  @ApiProperty({ description: 'Role', enum: UserRole, enumName: 'UserRole', example: 'VENDEDOR', required: false })
  @IsString()
  @IsOptional()
  @IsEnum(UserRole)
  @MaxLength(50)
  role?: UserRole | string;

  @ApiProperty({ description: 'First name', example: 'John', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  firstName?: string;

  @ApiProperty({ description: 'Last name', example: 'Smith', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  lastName?: string;

  @ApiProperty({ description: 'Cedula', example: '1234567890', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  cedula?: string;
}
