import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsNotEmpty, IsOptional, IsUUID, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * Available roles for users in the system.
 */
export enum UserRole {
  ADMIN = 'ADMIN',
  VENDEDOR = 'VENDEDOR',
  CAJERO = 'CAJERO',
  BODEGA = 'BODEGA',
}

/**
 * DTO for registering a new employee/user in the system.
 * Maps to the USR_TABLA entity fields.
 */
export class RegisterEmployeeDto {
  @ApiProperty({ description: 'Email address', example: 'jsmith@billflow.com' })
  @IsEmail()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  email: string;

  @ApiProperty({ description: 'First name', example: 'John' })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  firstName: string;

  @ApiProperty({ description: 'Last name', example: 'Smith' })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  lastName: string;

  @ApiProperty({ description: 'Cedula', example: '1234567890', required: false })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  cedula?: string;

  @ApiProperty({ description: 'Role', enum: UserRole, enumName: 'UserRole', example: 'VENDEDOR' })
  @IsString()
  @IsNotEmpty()
  @IsEnum(UserRole)
  role: UserRole | string;

  @ApiProperty({ description: 'Username', example: 'jsmith', required: false })
  @IsString()
  @IsOptional()
  username?: string;

  @ApiProperty({ description: 'Default branch UUID', required: false })
  @IsUUID()
  @IsOptional()
  defaultBranchId?: string;
}
