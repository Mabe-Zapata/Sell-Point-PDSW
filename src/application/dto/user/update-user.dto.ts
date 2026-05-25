import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  MaxLength,
  IsOptional,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateUserDto {
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

  @ApiProperty({ description: 'Email address', example: 'jsmith@billflow.com', required: false })
  @IsEmail({}, { message: 'Invalid email format' })
  @IsOptional()
  @MaxLength(255)
  email?: string;

  @ApiProperty({ description: 'Role', example: 'VENDEDOR', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  role?: string;

  @ApiProperty({ description: 'Cedula', example: '1234567890', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  cedula?: string;
}