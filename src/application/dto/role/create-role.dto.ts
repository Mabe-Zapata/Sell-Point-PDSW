import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateRoleDto {
  @ApiProperty({ description: 'Nombre del rol', example: 'SUPERVISOR' })
  @IsString()
  @IsNotEmpty({ message: 'Role name is required' })
  @MaxLength(50)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  name!: string;

  @ApiProperty({ description: 'Descripción del rol', example: 'Supervisor de ventas', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  description?: string;
}