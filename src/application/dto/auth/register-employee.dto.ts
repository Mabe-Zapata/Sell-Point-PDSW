import { IsEmail, IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';

export enum UserRole {
  EMPLOYEE = 'EMPLOYEE',
  CUSTOMER = 'CUSTOMER',
}

export class RegisterEmployeeDto {
  @IsEmail()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  email: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  lastName: string;

  @IsEnum(UserRole)
  role: 'EMPLOYEE' | 'CUSTOMER';
}
