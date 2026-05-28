/* eslint-disable @typescript-eslint/no-unsafe-return */
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
  @IsEmail()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  email!: string;
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  firstName!: string;
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  lastName!: string;
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  cedula?: string;
  @IsString()
  @IsNotEmpty()
  @IsEnum(UserRole)
  role!: UserRole | string;
  @IsString()
  @IsOptional()
  username?: string;
  @IsUUID()
  @IsOptional()
  defaultBranchId?: string;
}

