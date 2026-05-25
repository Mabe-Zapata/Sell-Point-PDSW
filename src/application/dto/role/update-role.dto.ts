import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdateRoleDto {
  @ApiProperty({ description: 'Descripción del rol', example: 'Supervisor de ventas', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  description?: string;
}