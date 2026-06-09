import { Transform } from 'class-transformer';
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateMyProfileDto {
  @IsString({ message: 'firstName debe ser un texto' })
  @IsOptional()
  @MinLength(1, { message: 'firstName no puede estar vacío' })
  @MaxLength(100, { message: 'firstName no puede tener más de 100 caracteres' })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  firstName?: string;

  @IsString({ message: 'lastName debe ser un texto' })
  @IsOptional()
  @MinLength(1, { message: 'lastName no puede estar vacío' })
  @MaxLength(100, { message: 'lastName no puede tener más de 100 caracteres' })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  lastName?: string;

  @IsEmail({}, { message: 'email debe tener un formato válido' })
  @IsOptional()
  @MaxLength(255, { message: 'email no puede tener más de 255 caracteres' })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  email?: string;
}
