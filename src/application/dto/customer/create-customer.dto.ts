import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsNotEmpty,
  MaxLength,
  IsOptional,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateCustomerDto {
  @ApiProperty({ description: 'Identification document number (CI/RUC)', example: '0999999999001' })
  @IsString()
  @IsNotEmpty({ message: 'Cedula is required' })
  @MaxLength(20)
  cedula!: string;

  @ApiProperty({ description: 'Customer first name', example: 'John' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  firstName!: string;

  @ApiProperty({ description: 'Customer last name', example: 'Smith', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  lastName?: string;

  @ApiProperty({ description: 'Customer email address', example: 'john.smith@example.com', required: false })
  @IsEmail({}, { message: 'Invalid email format' })
  @IsOptional()
  @MaxLength(255)
  email?: string;

  @ApiProperty({ description: 'Customer phone number', example: '+593999999999', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;

  @ApiProperty({ description: 'Customer physical address', example: 'Av. Amazonas N35-42 y Francisco de Orellana', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  address?: string;
}