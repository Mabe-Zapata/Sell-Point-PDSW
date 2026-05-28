import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateRoleDto {
  @IsString()
  @IsNotEmpty({ message: 'Role name is required' })
  @MaxLength(50)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  name!: string;
  @IsString()
  @IsOptional()
  @MaxLength(255)
  description?: string;
}
